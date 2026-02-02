import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser, Session } from "../models/session";
import {
  clearSession,
  getSession,
  setGuestSession,
  setUserSession,
} from "../services/sessionStorage";

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const s = await getSession();
    setSessionState(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isGuest = session?.mode === "guest";
  const isUser = session?.mode === "user";

  const displayName = useMemo(() => {
    if (isUser) return session.user.firstName || session.user.email || "User";
    if (isGuest) return "Guest";
    return "Guest"; // default fallback if no session saved yet
  }, [isGuest, isUser, session]);

  const loginAsGuest = useCallback(async () => {
    await setGuestSession();
    await refresh();
  }, [refresh]);

  const loginAsUser = useCallback(
    async (user: AuthUser) => {
      await setUserSession(user);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await clearSession();
    await refresh();
  }, [refresh]);

  return {
    session,
    loading,
    displayName,
    isGuest,
    isUser,
    refresh,
    loginAsGuest,
    loginAsUser,
    logout,
  };
}
