import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import type { AuthUser } from "./auth.types";
import {
  bootstrapSession,
  signIn as signInSession,
  signInWithAccessToken as signInWithAccessTokenSession,
  signOut as signOutSession,
} from "./auth.session";
import { clearAuthState, saveAuthState } from "./auth.storage";
import { setApiAuthToken } from "../../lib/api";
import { clearSession, setUserSession } from "./services/sessionStorage";
import { subscribeUnauthorized } from "./auth.events";

type AuthMode = "authed" | "guest" | "anonymous";

type AuthContextValue = {
  hydrated: boolean;
  mode: AuthMode;
  user: AuthUser | null;
  token: string | null;
  guestId: string | null;
  isGuest: boolean;
  setAuthed: (token: string, user: AuthUser) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithToken: (accessToken: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("anonymous");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  const applyAnonymous = useCallback(() => {
    setMode("anonymous");
    setUser(null);
    setToken(null);
    setGuestId(null);
  }, []);

  const hydrate = useCallback(async () => {
    try {
      const session = await bootstrapSession();

      if (session.mode === "authed") {
        setMode("authed");
        setUser(session.user);
        setToken(session.token);
        setGuestId(null);
        return;
      }

      if (session.mode === "guest") {
        setMode("guest");
        setUser(null);
        setToken(null);
        setGuestId(session.guestId);
        return;
      }

      applyAnonymous();
    } finally {
      setHydrated(true);
    }
  }, [applyAnonymous]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const unsubscribe = subscribeUnauthorized(async () => {
      Alert.alert("Session expired", "Your session has expired. Please log in again.");
      await signOutSession();
      await GoogleSignin.revokeAccess().catch(() => undefined);
      await GoogleSignin.signOut().catch(() => undefined);
      applyAnonymous();
    });

    return unsubscribe;
  }, [applyAnonymous]);

  const setAuthed = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    await saveAuthState({
      mode: "authed",
      token: nextToken,
      user: nextUser,
    });

    await setUserSession({
      id: nextUser.id,
      firstName: nextUser.firstName ?? "",
      lastName: nextUser.lastName,
      email: nextUser.email,
      role: nextUser.role,
      volunteerStatus: nextUser.volunteerStatus,
      authProvider: nextUser.authProvider,
      emailVerified: nextUser.emailVerified,
      passwordSet: nextUser.passwordSet,
      googleLinked: nextUser.googleLinked,
      accessToken: nextToken,
    });

    setApiAuthToken(nextToken);
    setMode("authed");
    setUser(nextUser);
    setToken(nextToken);
    setGuestId(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await signInSession(email, password);
    setUser(session.user);
    setToken(session.token);
    setMode("authed");
    setGuestId(null);
  }, []);

  const signInWithToken = useCallback(async (accessToken: string) => {
    const session = await signInWithAccessTokenSession(accessToken);
    setUser(session.user);
    setToken(session.token);
    setMode("authed");
    setGuestId(null);
  }, []);

  const continueAsGuest = useCallback(async () => {
    const nextGuestId = `guest_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    await clearAuthState();
    setApiAuthToken(null);
    await clearSession();
    setMode("guest");
    setUser(null);
    setToken(null);
    setGuestId(nextGuestId);
  }, []);

  const signOut = useCallback(async () => {
    await signOutSession();
    await GoogleSignin.revokeAccess().catch(() => undefined);
    await GoogleSignin.signOut().catch(() => undefined);
    applyAnonymous();
  }, [applyAnonymous]);

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      mode,
      user,
      token,
      guestId,
      isGuest: mode === "guest",
      setAuthed,
      signIn,
      signInWithToken,
      continueAsGuest,
      signOut,
    }),
    [
      hydrated,
      mode,
      user,
      token,
      guestId,
      setAuthed,
      signIn,
      signInWithToken,
      continueAsGuest,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
