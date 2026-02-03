import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { loginCommunity } from "../services/authApi";
import { authStorage } from "../services/authStorage";
import { validateLogin } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";
import { useSession } from "./useSession";

export function useLogin() {
  const router = useRouter();
  const { loginAsGuest, loginAsUser } = useSession();

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
      const cleanEmail = email.trim().toLowerCase();

      const { accessToken, user } = await loginCommunity({ email: email.trim(), password });

        // ✅ set session so Home header shows firstName
        await loginAsUser({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessToken: accessToken,
          role: user.role,
        });

        router.replace("/(tabs)");

    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, router, loginAsUser]);

  const skip = useCallback(async () => {
    if (loading) return;
    setError(null);

    try {
      await loginAsGuest();
      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to enter guest mode"));
    }
  }, [loading, loginAsGuest, router]);

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
    goSignup: () => router.push("/(auth)/signup"),
    skip,
  };
}
