import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { loginCommunity } from "../services/authApi";
import { authStorage } from "../services/authStorage";
import { validateLogin } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";

export function useLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = useCallback(async () => {
    if (loading) return;

    setError(null);

    const validation = validateLogin({ email, password });
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      const token = await loginCommunity({ email: email.trim(), password });
      await authStorage.setToken(token);

      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, router]);

  return {
    email,
    password,
    showPassword,
    loading,
    error,
    setEmail,
    setPassword,
    toggleShowPassword: () => setShowPassword((s) => !s),
    onLogin,
    goSignup: () => router.push("/signup"),
    skip: () => router.replace("/(tabs)"),
  };
}
