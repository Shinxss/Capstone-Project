import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storageKeys";

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

// Optional: keep interceptor as backup (works even if defaults not set yet)
api.interceptors.request.use(async (config) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return config;

    const session = JSON.parse(raw);
    const token = session?.user?.accessToken ?? null;

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  } catch {
    return config;
  }
});
