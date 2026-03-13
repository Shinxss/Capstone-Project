import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { resetPassword } from "../services/otpAuth.api";
import { getErrorMessage } from "../utils/authErrors";
import {
  getPasswordChecks,
  isPasswordPolicyValid,
  normalizeEmail,
  PASSWORD_POLICY_MESSAGE,
} from "../utils/authValidators";

export function useResetPassword(email: string, resetToken: string) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const trimmedResetToken = useMemo(() => resetToken.trim(), [resetToken]);
  const passwordChecks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const passwordsMatch = useMemo(
    () => confirmPassword.length > 0 && confirmPassword === newPassword,
    [confirmPassword, newPassword]
  );
  const mismatchError =
    confirmPassword.length > 0 && !passwordsMatch ? "Confirmation password does not match." : null;
  const canSubmit =
    Boolean(normalizedEmail) &&
    Boolean(trimmedResetToken) &&
    isPasswordPolicyValid(newPassword) &&
    passwordsMatch &&
    !loading;

  const onChangeNewPassword = useCallback((value: string) => {
    setNewPassword(value);
    setError(null);
  }, []);

  const onChangeConfirmPassword = useCallback((value: string) => {
    setConfirmPassword(value);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (!normalizedEmail || !trimmedResetToken) {
      setError("Invalid password reset session.");
      return;
    }

    if (!isPasswordPolicyValid(newPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(normalizedEmail, trimmedResetToken, newPassword, confirmPassword);
      Alert.alert("Password Reset Successful", "Your password has been updated. Please sign in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  }, [confirmPassword, loading, newPassword, normalizedEmail, router, trimmedResetToken]);

  return {
    email: normalizedEmail,
    newPassword,
    confirmPassword,
    showNewPassword,
    showConfirmPassword,
    loading,
    error,
    passwordChecks,
    passwordsMatch,
    mismatchError,
    canSubmit,
    setNewPassword: onChangeNewPassword,
    setConfirmPassword: onChangeConfirmPassword,
    toggleShowNewPassword: () => setShowNewPassword((prev) => !prev),
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
    submit,
    goBack: () => router.back(),
  };
}
