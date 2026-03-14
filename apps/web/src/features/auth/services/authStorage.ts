import { AUTH_STORAGE_KEYS } from "../constants/auth.constants";

export type StoredPortalUser = {
  id: string;
  username?: string;
  email?: string;
  role: string;
  adminTier?: "SUPER" | "CDRRMO";
  firstName?: string;
  lastName?: string;

  // optional LGU fields
  lguName?: string;
  lguPosition?: string;
  barangay?: string;
  municipality?: string;
  birthdate?: string;
  contactNo?: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
};

type AuthSessionSnapshot = {
  token: string;
  userRaw: string;
};

const EMPTY_SNAPSHOT: AuthSessionSnapshot = { token: "", userRaw: "" };

const inMemorySession: AuthSessionSnapshot = { token: "", userRaw: "" };

function getSessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocalStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clearLegacyLocalAuth(localStore: Storage | null) {
  if (!localStore) return;

  localStore.removeItem(AUTH_STORAGE_KEYS.lguToken);
  localStore.removeItem(AUTH_STORAGE_KEYS.lguUser);
}

function readSessionSnapshot(): AuthSessionSnapshot {
  const sessionStore = getSessionStore();
  const localStore = getLocalStore();

  const token = sessionStore?.getItem(AUTH_STORAGE_KEYS.lguToken) || "";
  const userRaw = sessionStore?.getItem(AUTH_STORAGE_KEYS.lguUser) || "";

  if (token || userRaw) {
    clearLegacyLocalAuth(localStore);
    inMemorySession.token = token;
    inMemorySession.userRaw = userRaw;
    return { token, userRaw };
  }

  const legacyToken = localStore?.getItem(AUTH_STORAGE_KEYS.lguToken) || "";
  const legacyUserRaw = localStore?.getItem(AUTH_STORAGE_KEYS.lguUser) || "";

  if (legacyToken || legacyUserRaw) {
    if (sessionStore) {
      if (legacyToken) {
        sessionStore.setItem(AUTH_STORAGE_KEYS.lguToken, legacyToken);
      }
      if (legacyUserRaw) {
        sessionStore.setItem(AUTH_STORAGE_KEYS.lguUser, legacyUserRaw);
      }
    }

    clearLegacyLocalAuth(localStore);
    inMemorySession.token = legacyToken;
    inMemorySession.userRaw = legacyUserRaw;

    return { token: legacyToken, userRaw: legacyUserRaw };
  }

  if (inMemorySession.token || inMemorySession.userRaw) {
    return { token: inMemorySession.token, userRaw: inMemorySession.userRaw };
  }

  return EMPTY_SNAPSHOT;
}

function emitAuthChanged() {
  window.dispatchEvent(new Event("lifeline-auth-changed"));
}

export function setLguSession(token: string, user: StoredPortalUser) {
  const nextToken = token || "";
  const nextUserRaw = JSON.stringify(user);
  const sessionStore = getSessionStore();

  if (sessionStore) {
    sessionStore.setItem(AUTH_STORAGE_KEYS.lguToken, nextToken);
    sessionStore.setItem(AUTH_STORAGE_KEYS.lguUser, nextUserRaw);
  } else {
    inMemorySession.token = nextToken;
    inMemorySession.userRaw = nextUserRaw;
  }

  clearLegacyLocalAuth(getLocalStore());
  emitAuthChanged();
}

export function getLguSessionSnapshot() {
  return readSessionSnapshot();
}

export function getLguToken() {
  return readSessionSnapshot().token;
}

export function getLguUser(): StoredPortalUser | null {
  try {
    const raw = readSessionSnapshot().userRaw;
    return raw ? (JSON.parse(raw) as StoredPortalUser) : null;
  } catch {
    return null;
  }
}

export function clearLguSession() {
  const sessionStore = getSessionStore();
  sessionStore?.removeItem(AUTH_STORAGE_KEYS.lguToken);
  sessionStore?.removeItem(AUTH_STORAGE_KEYS.lguUser);

  clearLegacyLocalAuth(getLocalStore());
  inMemorySession.token = "";
  inMemorySession.userRaw = "";

  emitAuthChanged();
}
