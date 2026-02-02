import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { registerCommunity } from "../services/authApi";
import { validateSignup } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";

export function useSignup() {
  const router = useRouter();

  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignup = useCallback(async () => {
    if (loading) return;
    setError(null);

    const validation = validateSignup({
      payload: { firstName, lastName, email, password },
      confirmPassword: confirm,
      agree,
    });

    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      const msg = await registerCommunity({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert("Success", msg);
      router.replace("/login");
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  }, [agree, confirm, email, firstName, lastName, loading, password, router]);

  return {
    firstName,
    lastName,
    email,
    password,
    confirm,
    showPassword,
    showConfirm,
    agree,
    loading,
    error,
    setFirst,
    setLast,
    setEmail,
    setPass,
    setConfirm,
    toggleShowPassword: () => setShowPassword((s) => !s),
    toggleShowConfirm: () => setShowConfirm((s) => !s),
    toggleAgree: () => setAgree((v) => !v),
    onSignup,
    goLogin: () => router.push("/login"),
  };
}
