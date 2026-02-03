import { AUTH_STORAGE_KEYS } from "../constants/auth.constants";

export function setLguToken(token: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.lguToken, token);
}

export function getLguToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.lguToken);
}

export function clearLguToken() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.lguToken);
}
