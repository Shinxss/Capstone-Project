import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import type { AuthUser, Session } from "../models/session";

type SessionListener = () => void;

const sessionListeners = new Set<SessionListener>();

function notifySessionListeners() {
  for (const listener of sessionListeners) {
    listener();
  }
}

export function subscribeSession(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

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
  notifySessionListeners();
}

export async function setUserSession(user: AuthUser): Promise<void> {
  const session: Session = { mode: "user", user };
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  notifySessionListeners();
}

export async function patchUserSession(partial: Partial<AuthUser>): Promise<void> {
  const session = await getSession();
  if (!session || session.mode !== "user") return;

  const next: Session = {
    mode: "user",
    user: {
      ...session.user,
      ...partial,
    },
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(next));
  notifySessionListeners();
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
  notifySessionListeners();
}
