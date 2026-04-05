import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../AuthProvider";
import {
  requestPasswordOtp,
  signupResendOtp,
  signupVerifyOtp,
  verifyPasswordOtp,
} from "../services/otpAuth.api";
import { getErrorMessage } from "../utils/authErrors";
import { normalizeEmail } from "../utils/authValidators";

export type OtpMode = "signup" | "reset";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function createEmptyOtpDigits() {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

function normalizeOtpDigits(digits: string[]) {
  const safeDigits = createEmptyOtpDigits();

  for (let index = 0; index < OTP_LENGTH; index += 1) {
    const value = digits[index] ?? "";
    safeDigits[index] = value.replace(/\D/g, "").slice(0, 1);
  }

  return safeDigits;
}

function maskEmailAddress(email: string) {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) return email;

  if (localPart.length <= 2) {
    const first = localPart.charAt(0) || "";
    return `${first}*@${domainPart}`;
  }

  const visiblePrefix = localPart.slice(0, 2);
  const hiddenLength = Math.max(2, localPart.length - 2);
  return `${visiblePrefix}${"*".repeat(hiddenLength)}@${domainPart}`;
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function mapVerificationError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid or expired")) {
    return "The code is invalid or expired. Request a new code and try again.";
  }

  if (normalized.includes("too many invalid otp attempts")) {
    return "Too many incorrect attempts. Request a new code.";
  }

  return message;
}

export function useOtpVerification(mode: OtpMode, email: string) {
  const router = useRouter();
  const { signInWithToken } = useAuth();

  const [otpDigits, setOtpDigitsState] = useState<string[]>(() => createEmptyOtpDigits());
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const contact = normalizedEmail;
  const otp = useMemo(() => otpDigits.join(""), [otpDigits]);

  const title = useMemo(
    () => (mode === "signup" ? "Verify Your Email" : "Verify Reset Code"),
    [mode]
  );
  const subtitle = "Enter the 6-digit code sent to your email.";
  const maskedContact = useMemo(() => maskEmailAddress(normalizedEmail), [normalizedEmail]);
  const canSubmit = otp.length === OTP_LENGTH && !loading;
  const canResend = resendCountdown <= 0 && !resending && !loading;
  const resendCountdownLabel = useMemo(() => formatCountdown(resendCountdown), [resendCountdown]);
  const resendLabel = canResend ? "Resend Code" : `Resend code in ${resendCountdownLabel}`;

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const setOtpDigits = useCallback((digits: string[]) => {
    setOtpDigitsState(normalizeOtpDigits(digits));
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (!contact) {
      setError("Missing email for OTP verification.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signupVerifyOtp(normalizedEmail, otp);
        if (result.accessToken) {
          await signInWithToken(result.accessToken);
          return;
        }

        Alert.alert("Signup Complete", "Your email is verified. Please sign in to continue.");
        router.replace("/(auth)/login");
        return;
      }

      const { resetToken } = await verifyPasswordOtp(normalizedEmail, otp);
      router.push({
        pathname: "/reset-password",
        params: { email: normalizedEmail, resetToken },
      });
    } catch (err) {
      const message = getErrorMessage(err, "OTP verification failed");
      setError(mapVerificationError(message));
    } finally {
      setLoading(false);
    }
  }, [contact, loading, mode, normalizedEmail, otp, router, signInWithToken]);

  const resend = useCallback(async () => {
    if (!canResend || !contact) return;
    setError(null);
    setResending(true);

    try {
      if (mode === "signup") {
        await signupResendOtp(normalizedEmail);
      } else {
        await requestPasswordOtp(normalizedEmail);
      }

      setOtpDigitsState(createEmptyOtpDigits());
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      Alert.alert("Code Sent", "A new verification code has been sent.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setResending(false);
    }
  }, [canResend, contact, mode, normalizedEmail]);

  return {
    mode,
    title,
    subtitle,
    email: normalizedEmail,
    contact,
    maskedContact,
    contactLabel: "email",
    otpDigits,
    otpLength: OTP_LENGTH,
    loading,
    resending,
    error,
    canSubmit,
    resendCountdown,
    resendCountdownLabel,
    canResend,
    resendLabel,
    setOtpDigits,
    submit,
    resend,
    goBack: () => router.back(),
  };
}
