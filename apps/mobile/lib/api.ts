import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { getSecure } from "./secureStore";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

export function setApiAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use(async (config) => {
  try {
    const rawAuthState = await getSecure(STORAGE_KEYS.AUTH_STATE);
    if (rawAuthState) {
      try {
        const authState = JSON.parse(rawAuthState) as { mode?: string; token?: string };
        if (authState?.mode === "authed" && typeof authState.token === "string" && authState.token.trim()) {
          config.headers = config.headers ?? {};
          (config.headers as any).Authorization = `Bearer ${authState.token}`;
          return config;
        }
      } catch {
        // fall through to legacy token/session logic
      }
    }

    const secureToken = await getSecure(STORAGE_KEYS.accessToken);
    if (secureToken) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${secureToken}`;
      return config;
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return config;

    const session = JSON.parse(raw);

    // ✅ support multiple possible shapes
    const token =
      session?.token ??
      session?.accessToken ??
      session?.user?.accessToken ??
      session?.user?.token ??
      null;

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  } catch {
    return config;
  }
});
