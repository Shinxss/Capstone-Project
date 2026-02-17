import { STORAGE_KEYS } from "../../constants/storageKeys";
import { getSecure, removeSecure, setSecure } from "../../lib/secureStore";
import type { AuthUser } from "./auth.types";

export type AnonymousAuthState = {
  mode: "anonymous";
};

export type GuestAuthState = {
  mode: "guest";
  guestId: string;
};

export type AuthedAuthState = {
  mode: "authed";
  token: string;
  user: AuthUser;
};

export type StoredAuthState = AnonymousAuthState | GuestAuthState | AuthedAuthState;

const DEFAULT_AUTH_STATE: AnonymousAuthState = { mode: "anonymous" };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return isNonEmptyString(candidate.id);
}

function normalizeState(raw: unknown): StoredAuthState {
  if (!raw || typeof raw !== "object") return DEFAULT_AUTH_STATE;

  const data = raw as Record<string, unknown>;
  const mode = data.mode;

  if (mode === "guest" && isNonEmptyString(data.guestId)) {
    return { mode: "guest", guestId: data.guestId };
  }

  if (mode === "authed" && isNonEmptyString(data.token) && isAuthUser(data.user)) {
    return {
      mode: "authed",
      token: data.token,
      user: data.user,
    };
  }

  return DEFAULT_AUTH_STATE;
}

export async function loadAuthState(): Promise<StoredAuthState> {
  const raw = await getSecure(STORAGE_KEYS.AUTH_STATE);
  if (!raw) return DEFAULT_AUTH_STATE;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeState(parsed);
  } catch {
    return DEFAULT_AUTH_STATE;
  }
}

export async function saveAuthState(state: StoredAuthState): Promise<void> {
  await setSecure(STORAGE_KEYS.AUTH_STATE, JSON.stringify(state));
}

export async function clearAuthState(): Promise<void> {
  await removeSecure(STORAGE_KEYS.AUTH_STATE);
}
