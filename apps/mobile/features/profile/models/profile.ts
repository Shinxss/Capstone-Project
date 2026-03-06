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
    barangay: safeString(user?.barangay),
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
  if (normalized === "VOLUNTEER") return "Volunteer";
  return "Community";
}

export function isApprovedVolunteer(role?: string | null, volunteerStatus?: string | null) {
  return (
    String(role ?? "").trim().toUpperCase() === "VOLUNTEER" &&
    String(volunteerStatus ?? "").trim().toUpperCase() === "APPROVED"
  );
}
