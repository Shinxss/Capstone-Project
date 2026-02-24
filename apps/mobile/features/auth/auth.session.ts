import { STORAGE_KEYS } from "../../constants/storageKeys";
import { api, setApiAuthToken } from "../../lib/api";
import { getSecure, removeSecure } from "../../lib/secureStore";
import type { AuthUser } from "./auth.types";
import { clearAuthState, loadAuthState, saveAuthState } from "./auth.storage";
import { clearSession, setGuestSession, setUserSession } from "./services/sessionStorage";

const COMMUNITY_LOGIN_PATH = "/api/auth/community/login";
const AUTH_ME_PATH = "/api/auth/me";
const LOGOUT_PATH = "/api/auth/logout";
const LEGACY_ACCESS_TOKEN_KEY = STORAGE_KEYS.accessToken;

type AnonymousBootstrapResult = {
  mode: "anonymous";
  user: null;
  token: null;
};

type GuestBootstrapResult = {
  mode: "guest";
  guestId: string;
  user: null;
  token: null;
};

type AuthedBootstrapResult = {
  mode: "authed";
  user: AuthUser;
  token: string;
};

export type BootstrapSessionResult =
  | AnonymousBootstrapResult
  | GuestBootstrapResult
  | AuthedBootstrapResult;

function toAnonymousResult(): AnonymousBootstrapResult {
  return { mode: "anonymous", user: null, token: null };
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function extractToken(payload: any): string | null {
  const candidates = [
    payload?.token,
    payload?.accessToken,
    payload?.data?.token,
    payload?.data?.accessToken,
    payload?.data?.data?.token,
    payload?.data?.data?.accessToken,
    payload?.data?.data?.data?.token,
    payload?.data?.data?.data?.accessToken,
  ];

  for (const candidate of candidates) {
    const token = asString(candidate);
    if (token) return token;
  }

  return null;
}

function parseAuthUser(payload: any): AuthUser | null {
  const data = payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
  const id = asString(data?.id) ?? asString(data?._id);
  if (!id) return null;

  return {
    id,
    email: asString(data?.email) ?? undefined,
    role: asString(data?.role) ?? undefined,
    firstName: asString(data?.firstName) ?? undefined,
    lastName: asString(data?.lastName) ?? undefined,
    volunteerStatus: asString(data?.volunteerStatus) ?? undefined,
    authProvider:
      data?.authProvider === "local" || data?.authProvider === "google" || data?.authProvider === "both"
        ? data.authProvider
        : undefined,
    emailVerified: getBoolean(data?.emailVerified),
    passwordSet: getBoolean(data?.passwordSet),
    googleLinked: getBoolean(data?.googleLinked),
  };
}

async function persistUserSession(user: AuthUser, token: string): Promise<void> {
  await setUserSession({
    id: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    volunteerStatus: user.volunteerStatus,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
    passwordSet: user.passwordSet,
    googleLinked: user.googleLinked,
    accessToken: token,
  });
}

async function persistAuthedState(token: string, user: AuthUser): Promise<void> {
  await saveAuthState({
    mode: "authed",
    token,
    user,
  });
  await persistUserSession(user, token);
}

async function cleanupToAnonymous(): Promise<void> {
  await clearAuthState();
  setApiAuthToken(null);
  await clearSession();
  await removeSecure(LEGACY_ACCESS_TOKEN_KEY);
}

export async function bootstrapSession(): Promise<BootstrapSessionResult> {
  const stored = await loadAuthState();

  if (stored.mode === "guest") {
    setApiAuthToken(null);
    await setGuestSession();
    await removeSecure(LEGACY_ACCESS_TOKEN_KEY);
    return { mode: "guest", guestId: stored.guestId, user: null, token: null };
  }

  if (stored.mode !== "authed") {
    const legacyToken = await getSecure(LEGACY_ACCESS_TOKEN_KEY);
    if (legacyToken) {
      try {
        return await signInWithAccessToken(legacyToken);
      } catch {
        // fall through to anonymous cleanup
      }
    }

    await cleanupToAnonymous();
    return toAnonymousResult();
  }

  const token = stored.token;
  setApiAuthToken(token);

  try {
    const res = await api.get(AUTH_ME_PATH);
    const user = parseAuthUser(res.data);

    if (!user) {
      throw new Error("No user payload returned");
    }

    await persistAuthedState(token, user);
    return { mode: "authed", user, token };
  } catch {
    await cleanupToAnonymous();
    return toAnonymousResult();
  }
}

export async function signIn(email: string, password: string): Promise<AuthedBootstrapResult> {
  const res = await api.post(COMMUNITY_LOGIN_PATH, { email, password });
  const token = extractToken(res.data);

  if (!token) {
    throw new Error("No token returned");
  }

  return signInWithAccessToken(token);
}

export async function signInWithAccessToken(accessToken: string): Promise<AuthedBootstrapResult> {
  const token = asString(accessToken);
  if (!token) {
    throw new Error("No token returned");
  }

  setApiAuthToken(token);

  try {
    const res = await api.get(AUTH_ME_PATH);
    const user = parseAuthUser(res.data);

    if (!user) {
      throw new Error("No user payload returned");
    }

    await persistAuthedState(token, user);
    await removeSecure(LEGACY_ACCESS_TOKEN_KEY);

    return { mode: "authed", user, token };
  } catch {
    await cleanupToAnonymous();
    throw new Error("Failed to establish session");
  }
}

export async function signOut(): Promise<void> {
  try {
    await api.post(LOGOUT_PATH);
  } catch {
    // Best effort server-side invalidation.
  }
  await cleanupToAnonymous();
}
