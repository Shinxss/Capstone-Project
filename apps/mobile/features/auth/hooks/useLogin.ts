import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { validateLogin } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";
import { useGoogleLogin } from "./useGoogleLogin";
import { useAuth } from "../AuthProvider";

export function useLogin() {
  const router = useRouter();
  const { signIn, continueAsGuest } = useAuth();
  const {
    start: onGoogle,
    loading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = useCallback(async () => {
    if (loading || googleLoading) return;

    setError(null);
    clearGoogleError();

    const validation = validateLogin({ email, password });
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, googleLoading, clearGoogleError, signIn]);

  const skip = useCallback(async () => {
    if (loading || googleLoading) return;
    setError(null);
    clearGoogleError();

    try {
      await continueAsGuest();
      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to enter guest mode"));
    }
  }, [loading, googleLoading, clearGoogleError, continueAsGuest, router]);

  return {
    email,
    password,
    showPassword,
    loading: loading || googleLoading,
    googleLoading,
    error: error ?? googleError,
    setEmail,
    setPassword,
    toggleShowPassword: () => setShowPassword((s) => !s),
    onLogin,
    onGoogle,
    goForgotPassword: () => router.push("/forgot-password"),
    goSignup: () => router.push("/(auth)/signup"),
    skip,
  };
}
