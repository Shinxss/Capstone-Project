import type { AuthUser } from "../../auth/models/session";

export type ProfileSummary = {
  lifelineId: string | null;
  fullName: string;
  role: string;
  volunteerStatus: string | null;
  email: string | null;
  contactNo: string | null;
  birthdate: string | null;
  address: string | null;
  gender: string | null;
  barangay: string | null;
  skills: string | null;
  avatarUrl: string | null;
  stats: {
    completedTasks: number;
    volunteerHours: number;
    avgResponseTimeMinutes: number | null;
    verifiedTasks: number;
  };
};

export type ProfileAchievement = {
  id: string;
  title: string;
  icon: "flash-outline" | "shield-checkmark-outline" | "navigate-outline" | "people-outline";
};

export type ProfileRequestShortcutTab = "assigned" | "en_route" | "arrived" | "resolved";

export type ProfileGender = "Male" | "Female" | "Prefer not to say";

export type EditableProfileFields = {
  firstName: string;
  lastName: string;
  contactNo: string;
  birthdate: string;
  barangay: string;
  gender: string;
  skills: string;
};

export type EditableProfile = EditableProfileFields & {
  id: string;
  lifelineId: string | null;
  email: string | null;
  role: string;
  volunteerStatus: string | null;
  avatarUrl: string | null;
};

export type UpdateMyProfilePayload = {
  firstName: string;
  lastName: string;
  contactNo?: string;
  birthdate?: string;
  barangay?: string;
  gender?: ProfileGender | "";
  skills?: string;
};

export const MOCK_PROFILE_ACHIEVEMENTS: ProfileAchievement[] = [
  { id: "first-responder", title: "First Responder", icon: "flash-outline" },
  { id: "verified-volunteer", title: "Verified Volunteer", icon: "shield-checkmark-outline" },
  { id: "route-ready", title: "Route Ready", icon: "navigate-outline" },
  { id: "community-helper", title: "Community Helper", icon: "people-outline" },
];

function safeString(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isVolunteerRole(role?: string | null) {
  return String(role ?? "").trim().toUpperCase() === "VOLUNTEER";
}

export function isResponderRole(role?: string | null) {
  return String(role ?? "").trim().toUpperCase() === "RESPONDER";
}

export function isDispatchAssigneeRole(role?: string | null) {
  const normalizedRole = String(role ?? "").trim().toUpperCase();
  return normalizedRole === "VOLUNTEER" || normalizedRole === "RESPONDER";
}

export function isCommunityRole(role?: string | null) {
  return String(role ?? "").trim().toUpperCase() === "COMMUNITY";
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function createProfileSummaryFallback(
  overrides: Partial<ProfileSummary> = {}
): ProfileSummary {
  return {
    lifelineId: overrides.lifelineId ?? null,
    fullName: overrides.fullName ?? "Guest User",
    role: overrides.role ?? "COMMUNITY",
    volunteerStatus: overrides.volunteerStatus ?? null,
    email: overrides.email ?? null,
    contactNo: overrides.contactNo ?? null,
    birthdate: overrides.birthdate ?? null,
    address: overrides.address ?? null,
    gender: overrides.gender ?? null,
    barangay: overrides.barangay ?? null,
    skills: overrides.skills ?? null,
    avatarUrl: overrides.avatarUrl ?? null,
    stats: {
      completedTasks: overrides.stats?.completedTasks ?? 0,
      volunteerHours: overrides.stats?.volunteerHours ?? 0,
      avgResponseTimeMinutes: overrides.stats?.avgResponseTimeMinutes ?? null,
      verifiedTasks: overrides.stats?.verifiedTasks ?? 0,
    },
  };
}

export function createProfileSummaryFallbackFromUser(user?: Partial<AuthUser> | null): ProfileSummary {
  const firstName = safeString(user?.firstName);
  const lastName = safeString(user?.lastName);
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    safeString(user?.email) ||
    "Guest User";

  return createProfileSummaryFallback({
    lifelineId: safeString(user?.lifelineId),
    fullName,
    role: safeString(user?.role) ?? "COMMUNITY",
    volunteerStatus: safeString(user?.volunteerStatus),
    email: safeString(user?.email),
    contactNo: safeString(user?.contactNo),
    birthdate: safeString(user?.birthdate),
    gender: safeString(user?.gender),
    barangay: safeString(user?.barangay),
    skills: safeString(user?.skills),
    avatarUrl: safeString(user?.avatarUrl),
  });
}

export function normalizeProfileSummary(raw: any): ProfileSummary {
  return createProfileSummaryFallback({
    lifelineId: safeString(raw?.lifelineId),
    fullName: safeString(raw?.fullName) ?? "User",
    role: safeString(raw?.role) ?? "COMMUNITY",
    volunteerStatus: safeString(raw?.volunteerStatus),
    email: safeString(raw?.email),
    contactNo: safeString(raw?.contactNo),
    birthdate: safeString(raw?.birthdate),
    address: safeString(raw?.address),
    gender: safeString(raw?.gender),
    barangay: safeString(raw?.barangay),
    skills: safeString(raw?.skills),
    avatarUrl: safeString(raw?.avatarUrl),
    stats: {
      completedTasks: Math.max(0, Math.round(safeNumber(raw?.stats?.completedTasks))),
      volunteerHours: safeNumber(raw?.stats?.volunteerHours),
      avgResponseTimeMinutes:
        raw?.stats?.avgResponseTimeMinutes === null || raw?.stats?.avgResponseTimeMinutes === undefined
          ? null
          : safeNumber(raw?.stats?.avgResponseTimeMinutes, 0),
      verifiedTasks: Math.max(0, Math.round(safeNumber(raw?.stats?.verifiedTasks))),
    },
  });
}

export function formatProfileRoleLabel(role?: string | null) {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (normalized === "RESPONDER") return "Responder";
  if (normalized === "VOLUNTEER") return "Volunteer";
  if (normalized === "LGU") return "LGU";
  if (normalized === "ADMIN") return "Admin";
  return "Community";
}

export function isApprovedVolunteer(role?: string | null, volunteerStatus?: string | null) {
  return (
    String(role ?? "").trim().toUpperCase() === "VOLUNTEER" &&
    String(volunteerStatus ?? "").trim().toUpperCase() === "APPROVED"
  );
}

export function normalizeEditableProfile(raw: any): EditableProfile {
  return {
    id: normalizeStringValue(raw?.id || raw?._id),
    lifelineId: safeString(raw?.lifelineId),
    email: safeString(raw?.email),
    role: normalizeStringValue(raw?.role || "COMMUNITY") || "COMMUNITY",
    volunteerStatus: safeString(raw?.volunteerStatus),
    avatarUrl: safeString(raw?.avatarUrl),
    firstName: normalizeStringValue(raw?.firstName),
    lastName: normalizeStringValue(raw?.lastName),
    contactNo: normalizeStringValue(raw?.contactNo),
    birthdate: normalizeStringValue(raw?.birthdate),
    barangay: normalizeStringValue(raw?.barangay),
    gender: normalizeStringValue(raw?.gender),
    skills: normalizeStringValue(raw?.skills),
  };
}

export function editableProfileFromUser(user?: Partial<AuthUser> | null): EditableProfile {
  return {
    id: normalizeStringValue(user?.id),
    lifelineId: safeString(user?.lifelineId),
    email: safeString(user?.email),
    role: normalizeStringValue(user?.role || "COMMUNITY") || "COMMUNITY",
    volunteerStatus: safeString(user?.volunteerStatus),
    avatarUrl: safeString(user?.avatarUrl),
    firstName: normalizeStringValue(user?.firstName),
    lastName: normalizeStringValue(user?.lastName),
    contactNo: normalizeStringValue(user?.contactNo),
    birthdate: normalizeStringValue(user?.birthdate),
    barangay: normalizeStringValue(user?.barangay),
    gender: normalizeStringValue(user?.gender),
    skills: normalizeStringValue(user?.skills),
  };
}

export function buildEditableProfilePayload(fields: EditableProfileFields): UpdateMyProfilePayload {
  return {
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    contactNo: fields.contactNo.trim() || undefined,
    birthdate: fields.birthdate.trim() || undefined,
    barangay: fields.barangay.trim() || undefined,
    gender: (fields.gender.trim() as ProfileGender | "") || undefined,
    skills: fields.skills.trim() || undefined,
  };
}
