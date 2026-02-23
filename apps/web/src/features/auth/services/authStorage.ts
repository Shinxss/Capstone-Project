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
};

function emitAuthChanged() {
  window.dispatchEvent(new Event("lifeline-auth-changed"));
}

export function setLguSession(token: string, user: StoredPortalUser) {
  localStorage.setItem(AUTH_STORAGE_KEYS.lguToken, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.lguUser, JSON.stringify(user));
  emitAuthChanged();
}

export function getLguToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.lguToken) || "";
}

export function getLguUser(): StoredPortalUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.lguUser);
    return raw ? (JSON.parse(raw) as StoredPortalUser) : null;
  } catch {
    return null;
  }
}

export function clearLguSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.lguToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.lguUser);
  emitAuthChanged();
}
