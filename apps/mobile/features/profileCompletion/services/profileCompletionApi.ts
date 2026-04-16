import { api } from "../../../lib/api";
import type { AuthUser } from "../../auth/auth.types";
import type { ProfileCompletionPayload } from "../models/profileCompletion";

export type CompleteProfileResult = {
  user: AuthUser;
};

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const nextValues = value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));

  return nextValues;
}

function extractUserPayload(payload: any) {
  return payload?.user ?? payload?.data?.user ?? payload?.data ?? payload;
}

function parseAuthUserPayload(raw: any): AuthUser {
  const id = asString(raw?.id) ?? asString(raw?._id);
  if (!id) {
    throw new Error("No user profile returned.");
  }

  return {
    id,
    lifelineId: asString(raw?.lifelineId),
    email: asString(raw?.email),
    role: asString(raw?.role),
    firstName: asString(raw?.firstName),
    lastName: asString(raw?.lastName),
    volunteerStatus: asString(raw?.volunteerStatus),
    contactNo: asString(raw?.contactNo),
    gender: asString(raw?.gender),
    skills: asString(raw?.skills),
    barangay: asString(raw?.barangay),
    municipality: asString(raw?.municipality),
    authProvider:
      raw?.authProvider === "local" || raw?.authProvider === "google" || raw?.authProvider === "both"
        ? raw.authProvider
        : undefined,
    emailVerified: asBoolean(raw?.emailVerified),
    passwordSet: asBoolean(raw?.passwordSet),
    googleLinked: asBoolean(raw?.googleLinked),
    profileCompletionRequired: asBoolean(raw?.profileCompletionRequired),
    missingProfileFields: asStringArray(raw?.missingProfileFields),
  };
}

export async function completeMyProfile(payload: ProfileCompletionPayload): Promise<CompleteProfileResult> {
  const response = await api.patch("/api/auth/complete-profile", payload);
  return {
    user: parseAuthUserPayload(extractUserPayload(response.data)),
  };
}
