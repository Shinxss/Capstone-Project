import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { signupRequestOtp } from "../services/otpAuth.api";
import { validateSignup } from "../utils/authValidators";
import { getErrorMessage } from "../utils/authErrors";
import { useGoogleLogin } from "./useGoogleLogin";

export function useSignup() {
  const router = useRouter();
  const {
    start: startGoogleLogin,
    loading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleLogin();

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
    if (loading || googleLoading) return;
    setError(null);
    clearGoogleError();

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
      const normalizedEmail = email.trim().toLowerCase();
      await signupRequestOtp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password,
      });

      router.push({
        pathname: "/otp-verification",
        params: { mode: "signup", email: normalizedEmail },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  }, [
    agree,
    clearGoogleError,
    confirm,
    email,
    firstName,
    googleLoading,
    lastName,
    loading,
    password,
    router,
  ]);

  const onGoogle = useCallback(async () => {
    if (loading || googleLoading) return;
    setError(null);
    await startGoogleLogin();
  }, [googleLoading, loading, startGoogleLogin]);

  return {
    firstName,
    lastName,
    email,
    password,
    confirm,
    showPassword,
    showConfirm,
    agree,
    loading: loading || googleLoading,
    googleLoading,
    error: error ?? googleError,
    setFirst,
    setLast,
    setEmail,
    setPass,
    setConfirm,
    toggleShowPassword: () => setShowPassword((s) => !s),
    toggleShowConfirm: () => setShowConfirm((s) => !s),
    toggleAgree: () => setAgree((v) => !v),
    onSignup,
    onGoogle,
    goLogin: () => router.push("/login"),
  };
}