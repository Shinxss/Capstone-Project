import { Types } from "mongoose";
import { User } from "./user.model";
import { VolunteerApplication } from "../volunteerApplications/volunteerApplication.model";
import { DispatchOffer } from "../dispatches/dispatch.model";

export type DispatchVolunteer = {
  id: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
};

export type ListDispatchVolunteersParams = {
  onlyApproved?: boolean;
  includeInactive?: boolean;
};

export type UserProfileSummary = {
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

function safeStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function toNullableString(value: unknown) {
  const normalized = safeStr(value);
  return normalized || null;
}

function joinAddressParts(parts: unknown[]) {
  return parts
    .map((part) => safeStr(part))
    .filter(Boolean)
    .join(", ");
}

function buildFullName(user: {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
}) {
  const fullName = [safeStr(user.firstName), safeStr(user.lastName)].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  return safeStr(user.email) || "User";
}

export async function listDispatchVolunteers(
  params: ListDispatchVolunteersParams = {}
): Promise<DispatchVolunteer[]> {
  const { onlyApproved = true, includeInactive = true } = params;

  const match: Record<string, any> = { role: "VOLUNTEER" };
  if (onlyApproved) match.volunteerStatus = "APPROVED";
  if (!includeInactive) match.isActive = true;

  const users = await User.find(match)
    .select("_id firstName lastName isActive barangay municipality")
    .sort({ createdAt: -1 })
    .lean();

  if (users.length === 0) return [];

  const userIds = users.map((u: any) => u._id as Types.ObjectId);

  // Optional enrichment: get latest VERIFIED volunteer application per user for skills/address
  const applications = await VolunteerApplication.find({
    userId: { $in: userIds },
    status: "verified",
  })
    .select("userId skillsOther barangay city")
    .sort({ createdAt: -1 })
    .lean();

  const appByUserId = new Map<string, any>();
  for (const app of applications) {
    const key = String((app as any).userId);
    if (!appByUserId.has(key)) appByUserId.set(key, app);
  }

  return users.map((u: any) => {
    const id = String(u._id);
    const app = appByUserId.get(id);

    const name = [safeStr(u.firstName), safeStr(u.lastName)].filter(Boolean).join(" ") || "Volunteer";
    const skill = safeStr(app?.skillsOther) || "General Volunteer";

    const barangay = safeStr(app?.barangay) || safeStr(u.barangay) || undefined;
    const municipality = safeStr(app?.city) || safeStr(u.municipality) || undefined;

    return {
      id,
      name,
      status: u.isActive ? "available" : "offline",
      skill,
      barangay,
      municipality,
    };
  });
}

export async function getUserProfileSummary(userId: string): Promise<UserProfileSummary | null> {
  if (!Types.ObjectId.isValid(userId)) return null;

  const objectId = new Types.ObjectId(userId);
  const user = await User.findById(objectId)
    .select("_id lifelineId firstName lastName email role volunteerStatus contactNo barangay municipality birthdate avatarUrl")
    .lean();

  if (!user) return null;

  const latestVerifiedApplication = await VolunteerApplication.findOne({
    userId: objectId,
    status: "verified",
  })
    .select("mobile barangay street city province birthdate sex skillsOther createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const role = safeStr(user.role).toUpperCase() || "COMMUNITY";
  const isVolunteer = role === "VOLUNTEER";

  let completedTasks = 0;
  let verifiedTasks = 0;
  let volunteerHours = 0;
  let avgResponseTimeMinutes: number | null = null;

  if (isVolunteer) {
    const [completedCount, verifiedCount, statOffers] = await Promise.all([
      DispatchOffer.countDocuments({
        volunteerId: objectId,
        status: { $in: ["DONE", "VERIFIED"] },
      }),
      DispatchOffer.countDocuments({
        volunteerId: objectId,
        status: "VERIFIED",
      }),
      DispatchOffer.find({
        volunteerId: objectId,
        status: { $in: ["ACCEPTED", "DONE", "VERIFIED"] },
      })
        .select("createdAt respondedAt completedAt verifiedAt updatedAt status")
        .lean(),
    ]);

    completedTasks = completedCount;
    verifiedTasks = verifiedCount;

    let responseDeltaSum = 0;
    let responseDeltaCount = 0;
    let totalVolunteerHours = 0;

    for (const offer of statOffers) {
      const createdAt = offer.createdAt instanceof Date ? offer.createdAt : new Date(offer.createdAt);
      const respondedAt =
        offer.respondedAt instanceof Date
          ? offer.respondedAt
          : offer.respondedAt
            ? new Date(offer.respondedAt)
            : null;

      if (respondedAt && Number.isFinite(createdAt.getTime()) && Number.isFinite(respondedAt.getTime())) {
        const diffMinutes = (respondedAt.getTime() - createdAt.getTime()) / 60_000;
        if (diffMinutes >= 0) {
          responseDeltaSum += diffMinutes;
          responseDeltaCount += 1;
        }
      }

      if (!respondedAt || !["DONE", "VERIFIED"].includes(String(offer.status ?? ""))) {
        continue;
      }

      const completedAt =
        offer.completedAt instanceof Date
          ? offer.completedAt
          : offer.completedAt
            ? new Date(offer.completedAt)
            : null;
      const verifiedAt =
        offer.verifiedAt instanceof Date
          ? offer.verifiedAt
          : offer.verifiedAt
            ? new Date(offer.verifiedAt)
            : null;
      const updatedAt = offer.updatedAt instanceof Date ? offer.updatedAt : new Date(offer.updatedAt);
      const endAt = completedAt ?? verifiedAt ?? updatedAt;

      if (!Number.isFinite(endAt.getTime())) continue;

      const durationHours = Math.max(0, (endAt.getTime() - respondedAt.getTime()) / 3_600_000);
      totalVolunteerHours += durationHours;
    }

    volunteerHours = roundToSingleDecimal(totalVolunteerHours);
    avgResponseTimeMinutes =
      responseDeltaCount > 0 ? roundToSingleDecimal(responseDeltaSum / responseDeltaCount) : null;
  }

  const applicationAddress = joinAddressParts([
    latestVerifiedApplication?.street,
    latestVerifiedApplication?.barangay,
    latestVerifiedApplication?.city,
    latestVerifiedApplication?.province,
  ]);
  const userAddress = joinAddressParts([user.barangay, user.municipality]);
  const resolvedAddress = applicationAddress || userAddress;

  return {
    lifelineId: toNullableString(user.lifelineId),
    fullName: buildFullName(user),
    role,
    volunteerStatus: toNullableString(user.volunteerStatus),
    email: toNullableString(user.email),
    contactNo: toNullableString(user.contactNo) ?? toNullableString(latestVerifiedApplication?.mobile),
    birthdate: toNullableString(user.birthdate) ?? toNullableString(latestVerifiedApplication?.birthdate),
    address: toNullableString(resolvedAddress),
    gender: toNullableString(latestVerifiedApplication?.sex),
    barangay: toNullableString(user.barangay) ?? toNullableString(latestVerifiedApplication?.barangay),
    skills: isVolunteer ? toNullableString(latestVerifiedApplication?.skillsOther) : null,
    avatarUrl: toNullableString(user.avatarUrl),
    stats: {
      completedTasks,
      volunteerHours,
      avgResponseTimeMinutes,
      verifiedTasks,
    },
  };
}
