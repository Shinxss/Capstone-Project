import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import type { AuthUser, Session } from "../models/session";
import {
  clearSession,
  getSession,
  patchUserSession,
  setGuestSession,
  setUserSession,
  subscribeSession,
} from "../services/sessionStorage";
import { setApiAuthToken } from "../../../lib/api";

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
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeSession(() => {
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    const token = session?.mode === "user" ? session.user.accessToken : null;
    setApiAuthToken(token);
  }, [session]);

  const isGuest = session?.mode === "guest";
  const isUser = session?.mode === "user";

  const displayName = useMemo(() => {
    if (isUser) return session.user.firstName || session.user.email || "User";
    if (isGuest) return "Guest";
    return "Guest";
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

  const updateUser = useCallback(
    async (partial: Partial<AuthUser>) => {
      await patchUserSession(partial);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await clearSession();
    await GoogleSignin.revokeAccess().catch(() => undefined);
    await GoogleSignin.signOut().catch(() => undefined);
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
    updateUser,
    logout,
  };
}
