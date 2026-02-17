import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { resetPassword } from "../services/otpAuth.api";
import { getErrorMessage } from "../utils/authErrors";

export function useResetPassword(email: string, resetToken: string) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, resetToken, newPassword, confirmPassword);
      Alert.alert("Password Updated", "Your password has been reset.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  }, [confirmPassword, email, loading, newPassword, resetToken, router]);

  return {
    newPassword,
    confirmPassword,
    showNewPassword,
    showConfirmPassword,
    loading,
    error,
    setNewPassword,
    setConfirmPassword,
    toggleShowNewPassword: () => setShowNewPassword((prev) => !prev),
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
    submit,
    goBack: () => router.back(),
  };
}
