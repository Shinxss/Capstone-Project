import { api } from "../../../lib/api";
import type { LoginRequest, SignupRequest } from "../models/auth.types";

const COMMUNITY_AUTH_BASE = "/api/auth/community";

export async function loginCommunity(payload: LoginRequest): Promise<string> {
  const res = await api.post(`${COMMUNITY_AUTH_BASE}/login`, payload);

  const token: string | undefined = res.data?.data?.accessToken;
  if (!token) throw new Error("No token returned");

  return token;
}

export async function registerCommunity(payload: SignupRequest): Promise<string> {
  const res = await api.post(`${COMMUNITY_AUTH_BASE}/register`, payload);

  // backend sometimes returns message, fallback safe
  return res.data?.message ?? "Account created.";
}
