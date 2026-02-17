import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { loginWithGoogle } from "../services/authApi";
import { getErrorMessage } from "../utils/authErrors";
import { useAuth } from "../AuthProvider";

type UseGoogleLoginOptions = {
  onIdToken?: (idToken: string) => Promise<void>;
};

export function useGoogleLogin(options: UseGoogleLoginOptions = {}) {
  const { signInWithToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, , promptAsync] = Google.useAuthRequest({
    scopes: ["openid", "profile", "email"],
    androidClientId,
    webClientId,
    clientId: webClientId,
  });

  useEffect(() => {
    if (Platform.OS !== "android") return;

    GoogleSignin.configure({
      webClientId,
      scopes: ["openid", "profile", "email"],
    });
  }, [webClientId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleIdToken = useCallback(
    async (idToken: string) => {
      if (options.onIdToken) {
        await options.onIdToken(idToken);
        return;
      }

      const { accessToken } = await loginWithGoogle({ idToken });
      await signInWithToken(accessToken);
    },
    [options, signInWithToken]
  );

  const startNativeAndroid = useCallback(async () => {
    if (!webClientId) {
      setError("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
      return;
    }

    if (androidClientId && webClientId === androidClientId) {
      setError("Google config error: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must be a Web OAuth client ID.");
      return;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) {
      return;
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      setError("Google sign-in did not return a valid token.");
      return;
    }

    await handleIdToken(idToken);
  }, [androidClientId, handleIdToken, webClientId]);

  const startAuthSessionFallback = useCallback(async () => {
    if (!request) {
      setError("Google Sign-In is not ready yet. Please try again.");
      return;
    }

    const response = await promptAsync({ useProxy: false } as any);

    if (response.type === "dismiss" || response.type === "cancel") {
      return;
    }

    if (response.type !== "success") {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    const idToken =
      response.authentication?.idToken ??
      (typeof response.params?.id_token === "string" ? response.params.id_token : undefined);

    if (!idToken) {
      setError("Google sign-in did not return a valid token.");
      return;
    }

    await handleIdToken(idToken);
  }, [handleIdToken, promptAsync, request]);

  const start = useCallback(async () => {
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      if (Platform.OS === "android") {
        await startNativeAndroid();
        return;
      }

      await startAuthSessionFallback();
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.IN_PROGRESS || err.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }

        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError("Google Play Services is unavailable on this device.");
          return;
        }
      }

      const message = err instanceof Error ? err.message : "";
      if (/non-recoverable sign in failure/i.test(message)) {
        setError(
          "Google sign-in failed due to OAuth configuration. Verify Android package/SHA-1 and Web client ID."
        );
        return;
      }

      setError(getErrorMessage(err, "Google login failed"));
    } finally {
      setLoading(false);
    }
  }, [loading, startNativeAndroid, startAuthSessionFallback]);

  return {
    start,
    loading,
    error,
    clearError,
  };
}
