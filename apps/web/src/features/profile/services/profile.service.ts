import { api } from "../../../lib/api";
import { getLguUser, setLguSession } from "../../auth/services/authStorage";
import type { LguProfile, ProfileUpdateInput } from "../models/profile.types";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

function safeStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

type AuthProfilePayload = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  adminTier?: "SUPER" | "CDRRMO";
  firstName?: string;
  lastName?: string;
  lguName?: string;
  lguPosition?: string;
  barangay?: string;
  municipality?: string;
  birthdate?: string;
  contactNo?: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
};

type AuthMeResponse = {
  user?: AuthProfilePayload;
  success?: boolean;
};

function toProfileFromSessionUser(u: NonNullable<ReturnType<typeof getLguUser>>): LguProfile {
  return {
    id: String(u.id || ""),
    firstName: safeStr(u.firstName),
    lastName: safeStr(u.lastName),
    birthdate: safeStr(u.birthdate) || undefined,
    email: safeStr(u.email),
    contactNo: safeStr(u.contactNo) || undefined,
    role: safeStr(u.role),
    country: safeStr(u.country) || undefined,
    postalCode: safeStr(u.postalCode) || undefined,
    avatarUrl: safeStr(u.avatarUrl) || undefined,
    barangay: safeStr(u.barangay) || undefined,
    municipality: safeStr(u.municipality) || undefined,
    position: safeStr(u.lguPosition) || undefined,
  };
}

export function getLocalProfile(): LguProfile | null {
  const u = getLguUser();
  if (!u) return null;

  return toProfileFromSessionUser(u);
}

export async function fetchProfileFromApi() {
  const res = await api.get<AuthMeResponse>("/api/auth/me");
  return res.data?.user;
}

export async function refreshProfileToLocalStorage() {
  const u = getLguUser();
  if (!u) return getLocalProfile();

  const apiUser = await fetchProfileFromApi();
  if (!apiUser?.id) return getLocalProfile();

  const merged = {
    ...u,
    id: String(apiUser.id),
    firstName: apiUser.firstName ?? u.firstName,
    lastName: apiUser.lastName ?? u.lastName,
    email: apiUser.email ?? u.email,
    role: apiUser.role ?? u.role,
    lguName: apiUser.lguName ?? u.lguName,
    lguPosition: apiUser.lguPosition ?? u.lguPosition,
    barangay: apiUser.barangay ?? u.barangay,
    municipality: apiUser.municipality ?? u.municipality,
    birthdate: apiUser.birthdate ?? u.birthdate,
    contactNo: apiUser.contactNo ?? u.contactNo,
    country: apiUser.country ?? u.country,
    postalCode: apiUser.postalCode ?? u.postalCode,
    avatarUrl: apiUser.avatarUrl ?? u.avatarUrl,
    adminTier: apiUser.adminTier ?? u.adminTier,
    username: apiUser.username ?? u.username,
  };

  setLguSession("", merged);
  return getLocalProfile();
}

export async function updateProfile(input: ProfileUpdateInput) {
  const u = getLguUser();
  if (!u) throw new Error("Missing session. Please login again.");

  const payload = {
    firstName: safeStr(input.firstName),
    lastName: safeStr(input.lastName),
    birthdate: safeStr(input.birthdate),
    email: safeStr(input.email),
    contactNo: safeStr(input.contactNo),
    country: safeStr(input.country),
    municipality: safeStr(input.municipality),
    barangay: safeStr(input.barangay),
    postalCode: safeStr(input.postalCode),
    lguPosition: safeStr(input.position),
    avatarUrl: safeStr(input.avatarUrl),
  };

  const res = await api.patch<AuthMeResponse>("/api/auth/me", payload);
  const apiUser = res.data?.user;
  if (!apiUser?.id) {
    throw new Error("Profile update failed: invalid server response");
  }

  const merged = {
    ...u,
    id: String(apiUser.id),
    firstName: apiUser.firstName ?? u.firstName,
    lastName: apiUser.lastName ?? u.lastName,
    email: apiUser.email ?? u.email,
    role: apiUser.role ?? u.role,
    adminTier: apiUser.adminTier ?? u.adminTier,
    username: apiUser.username ?? u.username,
    lguName: apiUser.lguName ?? u.lguName,
    lguPosition: apiUser.lguPosition ?? u.lguPosition,
    barangay: apiUser.barangay ?? u.barangay,
    municipality: apiUser.municipality ?? u.municipality,
    birthdate: apiUser.birthdate ?? u.birthdate,
    contactNo: apiUser.contactNo ?? u.contactNo,
    country: apiUser.country ?? u.country,
    postalCode: apiUser.postalCode ?? u.postalCode,
    avatarUrl: apiUser.avatarUrl ?? u.avatarUrl,
  };

  setLguSession("", merged);

  appendActivityLog({
    action: "Updated profile",
    entityType: "profile",
    entityId: String(u.id || ""),
    metadata: { email: merged.email, barangay: merged.barangay, municipality: merged.municipality },
  });

  return getLocalProfile();
}

export async function changePassword(params: { currentPassword: string; newPassword: string }) {
  void params;
  // TODO: Add backend endpoint for password updates.
  throw new Error("Password change is not available yet.");
}
