import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "expo-router";
import { validateLogin } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";
import { useGoogleLogin } from "./useGoogleLogin";
import { useAuth } from "../AuthProvider";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_COOLDOWN_SECONDS = 60;

function formatCooldown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainderSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`;
}

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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!cooldownEndsAt) {
      setCooldownRemainingSeconds(0);
      return;
    }

    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      setCooldownRemainingSeconds(remaining);
      if (remaining <= 0) {
        setCooldownEndsAt(null);
      }
    };

    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [cooldownEndsAt]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownRemainingSeconds(seconds);
    setCooldownEndsAt(Date.now() + seconds * 1000);
  }, []);

  const cooldownMessage =
    cooldownRemainingSeconds > 0
      ? `Too many login attempts. Try again in ${formatCooldown(cooldownRemainingSeconds)}.`
      : null;

  const onLogin = useCallback(async () => {
    if (loading || googleLoading) return;
    if (cooldownRemainingSeconds > 0) {
      setError(cooldownMessage);
      return;
    }

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
      setFailedAttempts(0);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const retryAfterRaw = err.response.headers?.["retry-after"];
        const retryAfter = Number.parseInt(String(retryAfterRaw ?? ""), 10);
        const cooldown = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : LOGIN_COOLDOWN_SECONDS;
        startCooldown(cooldown);
        setFailedAttempts(0);
      } else {
        const nextFailedAttempts = failedAttempts + 1;
        if (nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          startCooldown(LOGIN_COOLDOWN_SECONDS);
          setFailedAttempts(0);
        } else {
          setFailedAttempts(nextFailedAttempts);
          setError(getErrorMessage(err, "Login failed"));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [
    email,
    password,
    loading,
    googleLoading,
    cooldownRemainingSeconds,
    clearGoogleError,
    signIn,
    failedAttempts,
    startCooldown,
  ]);

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
    error: cooldownMessage ?? error ?? googleError,
    loginCooldownSeconds: cooldownRemainingSeconds,
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
