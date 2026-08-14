import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { validateLogin } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";
import { useGoogleLogin } from "./useGoogleLogin";
import { useAuth } from "../AuthProvider";

const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOGIN_COOLDOWN_MIN_SECONDS = 60;
const LOGIN_COOLDOWN_MAX_SECONDS = 60;

function clampCooldown(seconds: number) {
  return Math.min(LOGIN_COOLDOWN_MAX_SECONDS, Math.max(LOGIN_COOLDOWN_MIN_SECONDS, seconds));
}

function formatCooldown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainderSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`;
}

export function useLogin() {
  const router = useRouter();
  const { signIn, continueAsGuest, mode } = useAuth();
  const {
    start: onGoogle,
    loading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleLogin();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestNavigationPending, setGuestNavigationPending] = useState(false);
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

  useEffect(() => {
    if (!guestNavigationPending || mode !== "guest") return;
    router.replace("/(tabs)");
    setGuestNavigationPending(false);
    setGuestLoading(false);
  }, [guestNavigationPending, mode, router]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownRemainingSeconds(seconds);
    setCooldownEndsAt(Date.now() + seconds * 1000);
  }, []);

  const cooldownMessage =
    cooldownRemainingSeconds > 0
      ? `Too many login attempts. Try again in ${formatCooldown(cooldownRemainingSeconds)}.`
      : null;

  const onLogin = useCallback(async () => {
    if (loading || googleLoading || guestLoading) return;
    if (cooldownRemainingSeconds > 0) {
      setError(cooldownMessage);
      return;
    }

    setError(null);
    clearGoogleError();

    const validation = validateLogin({ identifier, password });
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      setFailedAttempts(0);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        const retryAfterRaw = err.response.headers?.["retry-after"];
        const retryAfter = Number.parseInt(String(retryAfterRaw ?? ""), 10);
        const cooldown =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? clampCooldown(retryAfter)
            : LOGIN_COOLDOWN_MIN_SECONDS;
        startCooldown(cooldown);
        setFailedAttempts(0);
      } else {
        const nextFailedAttempts = failedAttempts + 1;
        if (nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          startCooldown(LOGIN_COOLDOWN_MIN_SECONDS);
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
    identifier,
    password,
    loading,
    googleLoading,
    guestLoading,
    cooldownRemainingSeconds,
    cooldownMessage,
    clearGoogleError,
    signIn,
    failedAttempts,
    startCooldown,
  ]);

  const skip = useCallback(async () => {
    if (loading || googleLoading || guestLoading) return;
    setError(null);
    clearGoogleError();
    setGuestLoading(true);

    try {
      await continueAsGuest();
      setGuestNavigationPending(true);
    } catch (err) {
      setGuestLoading(false);
      setError(getErrorMessage(err, "Failed to enter guest mode"));
    }
  }, [clearGoogleError, continueAsGuest, googleLoading, guestLoading, loading]);

  return {
    identifier,
    password,
    showPassword,
    loading,
    googleLoading,
    guestLoading,
    error: cooldownMessage ?? error ?? googleError,
    loginCooldownSeconds: cooldownRemainingSeconds,
    setIdentifier,
    setPassword,
    toggleShowPassword: () => setShowPassword((s) => !s),
    onLogin,
    onGoogle,
    goForgotPassword: () => router.push("/forgot-password"),
    goSignup: () => router.push("/(auth)/signup"),
    skip,
  };
}
