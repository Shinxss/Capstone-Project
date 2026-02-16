import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { loginCommunity } from "../services/authApi";
import { validateLogin } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";
import { useSession } from "./useSession";
import { useGoogleLogin } from "./useGoogleLogin";

export function useLogin() {
  const router = useRouter();
  const { loginAsGuest, loginAsUser } = useSession();
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
      const { accessToken, user } = await loginCommunity({ email: email.trim(), password });

      await loginAsUser({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessToken,
        role: user.role,
        volunteerStatus: user.volunteerStatus,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        passwordSet: user.passwordSet,
        googleLinked: user.googleLinked,
      });

      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, googleLoading, clearGoogleError, router, loginAsUser]);

  const skip = useCallback(async () => {
    if (loading || googleLoading) return;
    setError(null);
    clearGoogleError();

    try {
      await loginAsGuest();
      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to enter guest mode"));
    }
  }, [loading, googleLoading, clearGoogleError, loginAsGuest, router]);

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