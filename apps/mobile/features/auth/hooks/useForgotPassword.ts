import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { requestPasswordOtp } from "../services/otpAuth.api";
import { getErrorMessage } from "../utils/authErrors";

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function useForgotPassword(initialEmail = "") {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!isEmailValid(normalizedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordOtp(normalizedEmail);
      router.push({
        pathname: "/otp-verification",
        params: { mode: "reset", email: normalizedEmail },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  }, [email, loading, router]);

  return {
    email,
    loading,
    error,
    setEmail,
    submit,
    goBack: () => router.back(),
  };
}
