import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import type { AuthUser, Session } from "../models/session";

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function setGuestSession(): Promise<void> {
  const session: Session = { mode: "guest" };
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export async function setUserSession(user: AuthUser): Promise<void> {
  const session: Session = { mode: "user", user };
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
}
