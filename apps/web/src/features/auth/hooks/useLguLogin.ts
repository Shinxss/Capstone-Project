import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lguLogin, adminMfaVerify } from "../services/lguAuth.service";
import { setLguSession } from "../services/authStorage";
import { AUTH_ROUTES } from "../constants/auth.constants";
import type { PortalLoginData } from "../models/auth.types";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";
import { toastError, toastInfo, toastWarning } from "@/services/feedback/toast.service";

const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOGIN_COOLDOWN_SECONDS = 5 * 60;

function formatCooldown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainderSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`;
}

// ✅ Type guards (fix union accessToken error)
function isMfaRequired(result: PortalLoginData): result is Extract<PortalLoginData, { mfaRequired: true }> {
  return (
    !!result &&
    typeof result === "object" &&
    "mfaRequired" in result &&
    (result as any).mfaRequired === true
  );
}

function hasAccessToken(result: PortalLoginData): result is Extract<PortalLoginData, { accessToken: string }> {
  return (
    !!result &&
    typeof result === "object" &&
    "accessToken" in result &&
    typeof (result as any).accessToken === "string"
  );
}

type RequestError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      code?: string;
    };
    headers?: Record<string, string | number | undefined>;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  const parsed = error as RequestError;
  return parsed.response?.data?.error || parsed.response?.data?.message || parsed.message || fallback;
}

function isSuspendedError(error: unknown) {
  const parsed = error as RequestError;
  const statusCode = Number(parsed.response?.status);
  const code = parsed.response?.data?.code;
  const message = getErrorMessage(error, "");
  return statusCode === 403 && (code === "ACCOUNT_SUSPENDED" || /suspend|inactive|disabled/i.test(message));
}

export function useLguLogin() {
  const navigate = useNavigate();

  const [username, setUsernameValue] = useState("");
  const [password, setPasswordValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);

  // ✅ MFA modal state
  const [mfaOpen, setMfaOpen] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otp, setOtp] = useState("");

  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

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
    const timer = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownEndsAt]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownRemainingSeconds(seconds);
    setCooldownEndsAt(Date.now() + seconds * 1000);
  }, []);

  const cooldownMessage =
    cooldownRemainingSeconds > 0
      ? `Too many login attempts. Try again in ${formatCooldown(cooldownRemainingSeconds)}.`
      : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownRemainingSeconds > 0) {
      setError(cooldownMessage);
      if (cooldownMessage) {
        toastWarning(cooldownMessage);
      }
      return;
    }

    setError(null);
    const nextUsernameError = username.trim() ? null : "Username is required";
    const nextPasswordError = password.trim() ? null : "Password is required";

    setUsernameError(nextUsernameError);
    setPasswordError(nextPasswordError);

    if (nextUsernameError || nextPasswordError) {
      toastWarning("Please provide both username and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await lguLogin({ username: username.trim(), password });

      // ✅ ADMIN => show modal
      if (isMfaRequired(result)) {
        setChallengeId(result.challengeId);
        setEmailMasked(result.emailMasked);
        setOtp("");
        setMfaError(null);
        setMfaOpen(true);
        toastInfo("MFA required", "Enter the OTP sent to your email.");
        return;
      }

      // ✅ LGU => token + redirect
      if (!hasAccessToken(result)) {
        throw new Error("No token returned");
      }

      setFailedAttempts(0);
      setLguSession(result.accessToken, result.user);
      appendActivityLog({
        action: "Auth login success",
        entityType: "system",
        entityId: result.user?.id ?? null,
      });
      navigate(AUTH_ROUTES.lguAfterLogin, { replace: true });
    } catch (err: unknown) {
      const parsed = err as RequestError;
      const statusCode = Number(parsed.response?.status);
      if (statusCode === 429) {
        const retryAfterRaw = parsed.response?.headers?.["retry-after"];
        const retryAfter = Number.parseInt(String(retryAfterRaw ?? ""), 10);
        const cooldown = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : LOGIN_COOLDOWN_SECONDS;
        startCooldown(cooldown);
        setFailedAttempts(0);
        toastWarning(`Too many login attempts. Try again in ${formatCooldown(cooldown)}.`);
      } else if (isSuspendedError(err)) {
        setFailedAttempts(0);
        const msg = getErrorMessage(err, "Account is suspended. Please contact your administrator.");
        setError(msg);
        toastWarning(msg);
      } else {
        const nextFailedAttempts = failedAttempts + 1;
        if (nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          startCooldown(LOGIN_COOLDOWN_SECONDS);
          setFailedAttempts(0);
          toastWarning(`Too many login attempts. Try again in ${formatCooldown(LOGIN_COOLDOWN_SECONDS)}.`);
        } else {
          setFailedAttempts(nextFailedAttempts);
          const msg = getErrorMessage(err, "Login failed");
          setError(msg);
          toastError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function setUsername(v: string) {
    setUsernameValue(v);
    if (usernameError && v.trim()) setUsernameError(null);
    if (error) setError(null);
  }

  function setPassword(v: string) {
    setPasswordValue(v);
    if (passwordError && v.trim()) setPasswordError(null);
    if (error) setError(null);
  }

  async function onVerifyOtp() {
    if (!otp.trim()) {
      const msg = "OTP is required.";
      setMfaError(msg);
      toastWarning(msg);
      return;
    }

    setMfaLoading(true);
    setMfaError(null);

    try {
      const data = await adminMfaVerify({ challengeId, code: otp });
      setLguSession(data.accessToken, data.user);
      appendActivityLog({
        action: "Auth login success (MFA)",
        entityType: "system",
        entityId: data.user?.id ?? null,
      });
      setMfaOpen(false);
      navigate(AUTH_ROUTES.adminAfterLogin, { replace: true });

    } catch (err: unknown) {
      const msg = getErrorMessage(err, "OTP verification failed");
      setMfaError(msg);
      if (isSuspendedError(err)) {
        toastWarning(msg);
      } else {
        toastError(msg);
      }
    } finally {
      setMfaLoading(false);
    }
  }

  function closeMfa() {
    setMfaOpen(false);
    setChallengeId("");
    setEmailMasked("");
    setOtp("");
    setMfaError(null);
  }

  return {
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error: cooldownMessage ?? error,
    loginCooldownSeconds: cooldownRemainingSeconds,
    usernameError,
    passwordError,
    onSubmit,

    // MFA props
    mfaOpen,
    emailMasked,
    otp,
    setOtp,
    mfaLoading,
    mfaError,
    onVerifyOtp,
    closeMfa,
  };
}
