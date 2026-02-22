import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { getSecure } from "./secureStore";
import { emitUnauthorized } from "../features/auth/auth.events";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-client-platform": "mobile",
  },
});

const AUTH_ENDPOINT_EXCLUSIONS = [
  "/api/auth/community/login",
  "/api/auth/community/register",
  "/api/auth/google",
  "/api/auth/signup",
  "/api/auth/password/forgot",
  "/api/auth/password/verify-otp",
  "/api/auth/password/reset",
  "/api/auth/logout",
];

let unauthorizedHandlingInFlight = false;

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "").toLowerCase();
    const isAuthEndpoint = AUTH_ENDPOINT_EXCLUSIONS.some((path) => requestUrl.includes(path));

    if (status === 401 && !isAuthEndpoint && !unauthorizedHandlingInFlight) {
      unauthorizedHandlingInFlight = true;
      try {
        await emitUnauthorized();
      } finally {
        unauthorizedHandlingInFlight = false;
      }
    }

    return Promise.reject(error);
  }
);
