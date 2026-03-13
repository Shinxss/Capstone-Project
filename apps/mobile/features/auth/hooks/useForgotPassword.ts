import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { requestPasswordOtp } from "../services/otpAuth.api";
import { getErrorMessage } from "../utils/authErrors";
import { isEmailValid, normalizeEmail } from "../utils/authValidators";

export function useForgotPassword(initialEmail = "") {
  const router = useRouter();
  const [email, setEmail] = useState(() => normalizeEmail(initialEmail));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const emailLooksValid = useMemo(() => isEmailValid(normalizedEmail), [normalizedEmail]);
  const canSubmit = emailLooksValid && !loading;

  const onChangeEmail = useCallback((value: string) => {
    setEmail(value.replace(/\s+/g, "").toLowerCase());
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (!emailLooksValid) {
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
  }, [emailLooksValid, loading, normalizedEmail, router]);

  return {
    email,
    loading,
    error,
    isEmailValid: emailLooksValid,
    canSubmit,
    setEmail: onChangeEmail,
    submit,
    goBack: () => router.back(),
    goToLogin: () => router.replace("/(auth)/login"),
  };
}
