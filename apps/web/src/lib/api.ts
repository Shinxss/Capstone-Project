import axios from "axios";
import { getLguToken } from "../features/auth/services/authStorage";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const normalizedBaseURL = baseURL.replace(/\/+$/, "");
const csrfEndpoint = normalizedBaseURL.endsWith("/api")
  ? `${normalizedBaseURL}/security/csrf`
  : `${normalizedBaseURL}/api/security/csrf`;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send CSRF cookie with every request
});

// ── CSRF token management (in-memory only) ──
let csrfToken: string | null = null;
let csrfPromise: Promise<void> | null = null;

/**
 * Fetch a CSRF token from the server.
 * Safe to call multiple times — deduplicates concurrent calls.
 */
export function fetchCsrfToken(): Promise<void> {
  if (!csrfPromise) {
    csrfPromise = axios
      .get<{ csrfToken: string }>(csrfEndpoint, {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (!data?.csrfToken) {
          throw new Error("Missing CSRF token in response");
        }
        csrfToken = data.csrfToken;
      })
      .catch((err) => {
        csrfToken = null;
        const status = err?.response?.status;
        const detail = err?.response?.data?.error || err?.message || "Unknown error";
        throw new Error(`Failed to fetch CSRF token${status ? ` (${status})` : ""}: ${detail}`);
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

// ── Request interceptor: attach Bearer + CSRF tokens ──
api.interceptors.request.use(async (config) => {
  // Attach Bearer token
  const token = getLguToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method ?? "").toLowerCase();

  // Lazily fetch CSRF token before the first unsafe request
  if (UNSAFE_METHODS.has(method) && !csrfToken) {
    await fetchCsrfToken();
    if (!csrfToken) {
      throw new Error("CSRF initialization failed. Please refresh and try again.");
    }
  }

  // Attach CSRF token for unsafe methods
  if (csrfToken && UNSAFE_METHODS.has(method)) {
    config.headers = config.headers ?? {};
    config.headers["x-csrf-token"] = csrfToken;
  }

  return config;
});

// ── Response interceptor: auto-refresh CSRF token on 403 and retry once ──
api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  const isCsrfError =
    error.response?.status === 403 &&
    (error.response?.data?.code === "CSRF_INVALID" ||
      String(error.response?.data?.error || "").toLowerCase().includes("csrf"));

  if (
    isCsrfError &&
    !original._csrfRetry &&
    UNSAFE_METHODS.has((original.method ?? "").toLowerCase())
  ) {
    original._csrfRetry = true;
    csrfToken = null; // force re-fetch
    await fetchCsrfToken();
    if (csrfToken) {
      original.headers = original.headers ?? {};
      original.headers["x-csrf-token"] = csrfToken;
      return api(original);
    }
  }
  return Promise.reject(error);
});
