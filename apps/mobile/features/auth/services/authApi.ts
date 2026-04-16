import { api } from "../../../lib/api";
import type { LoginRequest, SignupRequest } from "../models/auth.types";

const COMMUNITY_AUTH_BASE = "/api/auth/community";
const GOOGLE_AUTH_PATH = "/api/auth/google";
const LINK_GOOGLE_PATH = "/api/auth/link-google";
const SET_PASSWORD_PATH = "/api/auth/set-password";

export type CommunityLoginUser = {
  id: string;
  lifelineId?: string;
  email: string;
  firstName: string;
  lastName?: string;
  role?: string;
  volunteerStatus?: string;
  birthdate?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  gender?: string;
  skills?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
  profileCompletionRequired?: boolean;
  missingProfileFields?: string[];
};

export type CommunityLoginResult = {
  accessToken: string;
  user: CommunityLoginUser;
};

type GoogleLoginPayload = {
  idToken: string;
};

type SetPasswordPayload = {
  newPassword: string;
  confirmPassword: string;
};

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const nextValues = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);

  return nextValues;
}

function parseUserPayload(data: any): CommunityLoginUser {
  const id = data?.id;
  if (!id || typeof id !== "string") throw new Error("No user profile returned");

  return {
    id,
    lifelineId: typeof data?.lifelineId === "string" ? data.lifelineId : undefined,
    email: String(data?.email ?? ""),
    firstName: String(data?.firstName ?? ""),
    lastName: typeof data?.lastName === "string" ? data.lastName : undefined,
    role: typeof data?.role === "string" ? data.role : undefined,
    volunteerStatus: typeof data?.volunteerStatus === "string" ? data.volunteerStatus : undefined,
    birthdate: typeof data?.birthdate === "string" ? data.birthdate : undefined,
    contactNo: typeof data?.contactNo === "string" ? data.contactNo : undefined,
    barangay: typeof data?.barangay === "string" ? data.barangay : undefined,
    municipality: typeof data?.municipality === "string" ? data.municipality : undefined,
    gender: typeof data?.gender === "string" ? data.gender : undefined,
    skills: typeof data?.skills === "string" ? data.skills : undefined,
    avatarUrl: typeof data?.avatarUrl === "string" ? data.avatarUrl : undefined,
    authProvider:
      data?.authProvider === "local" || data?.authProvider === "google" || data?.authProvider === "both"
        ? data.authProvider
        : undefined,
    emailVerified: typeof data?.emailVerified === "boolean" ? data.emailVerified : undefined,
    passwordSet: typeof data?.passwordSet === "boolean" ? data.passwordSet : undefined,
    googleLinked: typeof data?.googleLinked === "boolean" ? data.googleLinked : undefined,
    profileCompletionRequired:
      typeof data?.profileCompletionRequired === "boolean" ? data.profileCompletionRequired : undefined,
    missingProfileFields: asStringArray(data?.missingProfileFields),
  };
}

function parseCommunityLoginData(data: any): CommunityLoginResult {
  const accessToken: string | undefined = data?.accessToken;
  const userPayload = data?.user;

  if (!accessToken) throw new Error("No token returned");

  return {
    accessToken,
    user: parseUserPayload(userPayload),
  };
}

export async function loginCommunity(payload: LoginRequest): Promise<CommunityLoginResult> {
  const res = await api.post(`${COMMUNITY_AUTH_BASE}/login`, payload);
  return parseCommunityLoginData(res.data?.data);
}

export async function loginWithGoogle(payload: GoogleLoginPayload): Promise<CommunityLoginResult> {
  const res = await api.post(GOOGLE_AUTH_PATH, payload);
  return parseCommunityLoginData(res.data?.data);
}

export async function registerCommunity(payload: SignupRequest): Promise<string> {
  const res = await api.post(`${COMMUNITY_AUTH_BASE}/register`, payload);
  return res.data?.message ?? "Account created.";
}

export async function linkGoogleAccount(payload: GoogleLoginPayload): Promise<CommunityLoginUser> {
  const res = await api.post(LINK_GOOGLE_PATH, payload);
  return parseUserPayload(res.data?.data?.user);
}

export async function setAccountPassword(payload: SetPasswordPayload): Promise<CommunityLoginUser> {
  const res = await api.post(SET_PASSWORD_PATH, payload);
  return parseUserPayload(res.data?.data?.user);
}
