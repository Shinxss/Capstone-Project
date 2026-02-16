import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { setAccountPassword } from "../services/authApi";
import { useSession } from "./useSession";
import { getErrorMessage } from "../utils/authErrors";

export function useSetPassword() {
  const router = useRouter();
  const { updateUser } = useSession();
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
      const user = await setAccountPassword({ newPassword, confirmPassword });
      await updateUser({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        volunteerStatus: user.volunteerStatus,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        passwordSet: user.passwordSet,
        googleLinked: user.googleLinked,
      });

      Alert.alert("Success", "Password created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create password"));
    } finally {
      setLoading(false);
    }
  }, [confirmPassword, loading, newPassword, router, updateUser]);

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
