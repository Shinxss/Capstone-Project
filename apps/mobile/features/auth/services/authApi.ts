import { api } from "../../../lib/api";
import type { LoginRequest, SignupRequest } from "../models/auth.types";

const COMMUNITY_AUTH_BASE = "/api/auth/community";

export type CommunityLoginUser = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role?: string;
  volunteerStatus?: string;
};

export type CommunityLoginResult = {
  accessToken: string;
  user: CommunityLoginUser;
};

export async function loginCommunity(payload: LoginRequest): Promise<CommunityLoginResult> {
  const res = await api.post(`${COMMUNITY_AUTH_BASE}/login`, payload);

  const data = res.data?.data;
  const accessToken: string | undefined = data?.accessToken;
  const user: CommunityLoginUser | undefined = data?.user;

  if (!accessToken) throw new Error("No token returned");
  if (!user?.firstName) throw new Error("No user profile returned");

  return { accessToken, user };
}

export async function registerCommunity(payload: SignupRequest): Promise<string> {
  const res = await api.post(`${COMMUNITY_AUTH_BASE}/register`, payload);
  return res.data?.message ?? "Account created.";
}
