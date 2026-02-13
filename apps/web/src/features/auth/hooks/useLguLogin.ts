import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lguLogin, adminMfaVerify } from "../services/lguAuth.service";
import { setLguSession } from "../services/authStorage";
import { AUTH_ROUTES } from "../constants/auth.constants";
import type { PortalLoginData } from "../models/auth.types";

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

export function useLguLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ MFA modal state
  const [mfaOpen, setMfaOpen] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [otp, setOtp] = useState("");

  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await lguLogin({ username, password });

      // ✅ ADMIN => show modal
      if (isMfaRequired(result)) {
        setChallengeId(result.challengeId);
        setEmailMasked(result.emailMasked);
        setOtp("");
        setMfaError(null);
        setMfaOpen(true);
        return;
      }

      // ✅ LGU => token + redirect
      if (!hasAccessToken(result)) {
        throw new Error("No token returned");
      }

      setLguSession(result.accessToken, result.user);
      navigate(AUTH_ROUTES.lguAfterLogin, { replace: true });
    } catch (err: any) {
      // your backend uses { success:false, error } for LGU/Admin login
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp() {
    setMfaLoading(true);
    setMfaError(null);

    try {
      const data = await adminMfaVerify({ challengeId, code: otp });
      setLguSession(data.accessToken, data.user);
      setMfaOpen(false);
      navigate(AUTH_ROUTES.adminAfterLogin, { replace: true });

    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "OTP verification failed";
      setMfaError(msg);
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
    error,
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
