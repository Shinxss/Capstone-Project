import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "./useSession";
import {
  requestPasswordOtp,
  signupResendOtp,
  signupVerifyOtp,
  verifyPasswordOtp,
} from "../services/otpAuth.api";
import { getErrorMessage } from "../utils/authErrors";

export type OtpMode = "signup" | "reset";

export function useOtpVerification(mode: OtpMode, email: string) {
  const router = useRouter();
  const { loginAsUser } = useSession();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "signup" ? "Verify your email" : "Enter reset OTP"),
    [mode]
  );

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signupVerifyOtp(email, code);
        if (result.accessToken && result.user?.id) {
          await loginAsUser({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            volunteerStatus: result.user.volunteerStatus,
            authProvider: result.user.authProvider,
            emailVerified: result.user.emailVerified,
            passwordSet: result.user.passwordSet,
            googleLinked: result.user.googleLinked,
            accessToken: result.accessToken,
          });
          router.replace("/(tabs)");
          return;
        }

        Alert.alert("Success", "Signup completed. Please login.");
        router.replace("/login");
        return;
      }

      const { resetToken } = await verifyPasswordOtp(email, code);
      router.push({
        pathname: "/reset-password",
        params: { email, resetToken },
      });
    } catch (err) {
      setError(getErrorMessage(err, "OTP verification failed"));
    } finally {
      setLoading(false);
    }
  }, [email, loading, loginAsUser, mode, otp, router]);

  const resend = useCallback(async () => {
    if (resending) return;
    setError(null);
    setResending(true);
    try {
      if (mode === "signup") {
        await signupResendOtp(email);
      } else {
        await requestPasswordOtp(email);
      }

      Alert.alert("OTP Sent", "A new OTP has been sent to your email.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setResending(false);
    }
  }, [email, mode, resending]);

  return {
    title,
    otp,
    loading,
    resending,
    error,
    setOtp,
    submit,
    resend,
    goBack: () => router.back(),
  };
}
