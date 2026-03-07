import { api } from "../../../lib/api";
import {
  normalizeEditableProfile,
  normalizeProfileSummary,
  type EditableProfile,
  type ProfileSummary,
  type UpdateMyProfilePayload,
} from "../models/profile";

export async function getProfileSummary(): Promise<ProfileSummary> {
  const response = await api.get("/api/users/me/profile-summary");
  return normalizeProfileSummary(response.data);
}

function extractUserPayload(payload: any) {
  return payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
}

export async function getMyProfile(): Promise<EditableProfile> {
  const response = await api.get("/api/auth/me");
  return normalizeEditableProfile(extractUserPayload(response.data));
}

export async function updateMyProfile(payload: UpdateMyProfilePayload): Promise<EditableProfile> {
  const response = await api.patch("/api/auth/me", payload);
  return normalizeEditableProfile(extractUserPayload(response.data));
}

export async function getProfileSkillOptions(): Promise<string[]> {
  const response = await api.get("/api/users/profile-skill-options");
  const rawSkills = response.data?.skills;
  if (!Array.isArray(rawSkills)) return [];

  return rawSkills
    .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
    .filter((value: string) => value.length > 0);
}
