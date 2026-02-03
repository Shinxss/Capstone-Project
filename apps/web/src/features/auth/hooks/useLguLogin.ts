import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lguLogin } from "../services/lguAuth.service";
import { setLguToken } from "../services/authStorage";
import { AUTH_ROUTES } from "../constants/auth.constants";

export function useLguLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { accessToken } = await lguLogin({ username, password });
      setLguToken(accessToken);
      navigate(AUTH_ROUTES.lguAfterLogin, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return {
    username,
    setUsername,
    password,
    setPassword,
    loading,
    error,
    onSubmit,
  };
}
