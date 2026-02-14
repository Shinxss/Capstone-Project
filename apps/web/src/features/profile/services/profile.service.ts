import { api } from "../../../lib/api";
import { getLguToken, getLguUser, setLguSession } from "../../auth/services/authStorage";
import type { LguProfile, ProfileUpdateInput } from "../models/profile.types";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

const USE_PROFILE_API = String((import.meta as any).env?.VITE_USE_PROFILE_API || "") === "1";

function safeStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function getLocalProfile(): LguProfile | null {
  const u = getLguUser();
  if (!u) return null;

  return {
    id: String(u.id || ""),
    firstName: safeStr(u.firstName),
    lastName: safeStr(u.lastName),
    email: safeStr(u.email),
    role: safeStr(u.role),
    barangay: safeStr(u.barangay) || undefined,
    municipality: safeStr(u.municipality) || undefined,
    position: safeStr(u.lguPosition) || undefined,
  };
}

export async function fetchProfileFromApi() {
  // Server supports GET /api/auth/me. If it fails, we keep local profile.
  const res = await api.get<{ user: { id: string; firstName?: string; lastName?: string; email?: string; role?: string } }>(
    "/api/auth/me"
  );
  return res.data?.user;
}

export async function refreshProfileToLocalStorage() {
  if (!USE_PROFILE_API) return getLocalProfile();

  const token = getLguToken();
  const u = getLguUser();
  if (!token || !u) return getLocalProfile();

  const apiUser = await fetchProfileFromApi();
  if (!apiUser?.id) return getLocalProfile();

  const merged = {
    ...u,
    id: String(apiUser.id),
    firstName: apiUser.firstName ?? u.firstName,
    lastName: apiUser.lastName ?? u.lastName,
    email: apiUser.email ?? u.email,
    role: (apiUser.role as any) ?? u.role,
  };

  setLguSession(token, merged);
  return getLocalProfile();
}

export async function updateProfile(input: ProfileUpdateInput) {
  // TODO: Implement backend endpoint for profile updates. For now, persist locally.
  const token = getLguToken();
  const u = getLguUser();
  if (!token || !u) throw new Error("Missing session. Please login again.");

  const merged = {
    ...u,
    firstName: safeStr(input.firstName),
    lastName: safeStr(input.lastName),
    email: safeStr(input.email),
    barangay: safeStr(input.barangay) || undefined,
    municipality: safeStr(input.municipality) || undefined,
    lguPosition: safeStr(input.position) || undefined,
  };

  setLguSession(token, merged);

  appendActivityLog({
    action: "Updated profile",
    entityType: "profile",
    entityId: String(u.id || ""),
    metadata: { email: merged.email, barangay: merged.barangay, municipality: merged.municipality },
  });

  return getLocalProfile();
}

export async function changePassword(_params: { currentPassword: string; newPassword: string }) {
  // TODO: Add backend endpoint for password updates.
  throw new Error("Password change is not available yet.");
}

