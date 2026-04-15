import { Types } from "mongoose";
import { User } from "./user.model";
import { VolunteerApplication } from "../volunteerApplications/volunteerApplication.model";
import { DispatchOffer } from "../dispatches/dispatch.model";
import { getVolunteerPresenceStatus } from "../../realtime/notificationsSocket";
import { ResponderTeam } from "../responderTeams/responderTeam.model";

export type DispatchVolunteer = {
  id: string;
  lifelineId?: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
};

export type ListDispatchVolunteersParams = {
  onlyApproved?: boolean;
  includeInactive?: boolean;
};

export type DispatchResponder = {
  id: string;
  lifelineId?: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  teamId?: string;
  teamName?: string;
};

export type ListDispatchRespondersParams = {
  includeInactive?: boolean;
  onlyOnDuty?: boolean;
  q?: string;
  barangay?: string;
  scopeBarangay?: string;
  teamId?: string;
  limit?: number;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function toDispatchAvailability(
  presence: ReturnType<typeof getVolunteerPresenceStatus>
): DispatchVolunteer["status"] {
  return presence === "OFFLINE" ? "offline" : "available";
}

async function buildActiveResponderTeamByMemberId(memberIds: string[]) {
  const validObjectIds = memberIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (validObjectIds.length === 0) return new Map<string, { id: string; name: string }>();

  const teams = await ResponderTeam.find({
    isActive: true,
    memberIds: { $in: validObjectIds },
  })
    .select("_id name memberIds")
    .sort({ updatedAt: -1, _id: -1 })
    .lean();

  const teamByMember = new Map<string, { id: string; name: string }>();
  for (const team of teams) {
    const summary = {
      id: String(team._id),
      name: safeStr(team.name),
    };

    for (const memberId of team.memberIds ?? []) {
      const key = String(memberId);
      if (!teamByMember.has(key)) {
        teamByMember.set(key, summary);
      }
    }
  }

  return teamByMember;
}

export async function listDispatchVolunteers(
  params: ListDispatchVolunteersParams = {}
): Promise<DispatchVolunteer[]> {
  const { onlyApproved = true, includeInactive = true } = params;

  const match: Record<string, any> = { role: "VOLUNTEER" };
  if (onlyApproved) match.volunteerStatus = "APPROVED";
  if (!includeInactive) match.isActive = true;

  const users = await User.find(match)
    .select("_id lifelineId firstName lastName isActive barangay municipality avatarUrl")
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
      lifelineId: safeStr(u.lifelineId) || undefined,
      name,
      status: toDispatchAvailability(getVolunteerPresenceStatus(id)),
      skill,
      barangay,
      municipality,
      avatarUrl: safeStr(u.avatarUrl) || undefined,
    };
  });
}

export async function listDispatchResponders(
  params: ListDispatchRespondersParams = {}
): Promise<DispatchResponder[]> {
  const {
    includeInactive = false,
    onlyOnDuty = true,
    q,
    barangay,
    scopeBarangay,
    teamId,
    limit = 100,
  } = params;

  const match: Record<string, unknown> = { role: "RESPONDER" };
  if (!includeInactive) {
    match.isActive = true;
  }
  if (onlyOnDuty) {
    match.onDuty = true;
  }

  const requestedBarangay = safeStr(barangay);
  const scopedBarangay = safeStr(scopeBarangay);

  if (scopedBarangay) {
    if (requestedBarangay && requestedBarangay !== scopedBarangay) {
      return [];
    }
    match.barangay = scopedBarangay;
  } else if (requestedBarangay) {
    match.barangay = requestedBarangay;
  }

  const search = safeStr(q);
  if (search) {
    const regex = new RegExp(escapeRegExp(search), "i");
    match.$or = [
      { username: regex },
      { email: regex },
      { firstName: regex },
      { lastName: regex },
      { skills: regex },
      { lifelineId: regex },
    ];
  }

  if (teamId) {
    if (!Types.ObjectId.isValid(teamId)) {
      return [];
    }

    const team = await ResponderTeam.findById(teamId).select("memberIds barangay isActive").lean();
    if (!team || !team.isActive) {
      return [];
    }

    if (scopedBarangay && safeStr(team.barangay) !== scopedBarangay) {
      return [];
    }

    const memberIds = (team.memberIds ?? [])
      .map((id: Types.ObjectId | string) => String(id))
      .filter((id: string) => Types.ObjectId.isValid(id));
    if (memberIds.length === 0) {
      return [];
    }

    match._id = { $in: memberIds.map((id: string) => new Types.ObjectId(id)) };
  }

  const normalizedLimit = Number.isFinite(limit) ? Math.min(200, Math.max(1, limit)) : 100;
  const users = await User.find(match)
    .select("_id lifelineId firstName lastName username email skills barangay municipality avatarUrl")
    .sort({ onDuty: -1, updatedAt: -1, createdAt: -1 })
    .limit(normalizedLimit)
    .lean();

  if (users.length === 0) return [];

  const teamByMember = await buildActiveResponderTeamByMemberId(users.map((user: any) => String(user._id)));

  return users.map((user: any) => {
    const userId = String(user._id);
    const team = teamByMember.get(userId);

    return {
      id: userId,
      lifelineId: safeStr(user.lifelineId) || undefined,
      name: buildFullName(user),
      status: toDispatchAvailability(getVolunteerPresenceStatus(userId)),
      skill: safeStr(user.skills) || "General Responder",
      barangay: safeStr(user.barangay) || undefined,
      municipality: safeStr(user.municipality) || undefined,
      avatarUrl: safeStr(user.avatarUrl) || undefined,
      teamId: team?.id,
      teamName: team?.name || undefined,
    };
  });
}

export async function getUserProfileSummary(userId: string): Promise<UserProfileSummary | null> {
  if (!Types.ObjectId.isValid(userId)) return null;

  const objectId = new Types.ObjectId(userId);
  const user = await User.findById(objectId)
    .select(
      "_id lifelineId firstName lastName email role volunteerStatus contactNo barangay municipality birthdate gender skills avatarUrl"
    )
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

      const completedAtForResponse =
        offer.completedAt instanceof Date
          ? offer.completedAt
          : offer.completedAt
            ? new Date(offer.completedAt)
            : null;

      // "Average response time" in volunteer profile is measured as:
      // assignment (dispatch createdAt) -> arrived on scene (completedAt / DONE).
      if (
        completedAtForResponse &&
        Number.isFinite(createdAt.getTime()) &&
        Number.isFinite(completedAtForResponse.getTime())
      ) {
        const diffMinutes = (completedAtForResponse.getTime() - createdAt.getTime()) / 60_000;
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
    gender: toNullableString(user.gender) ?? toNullableString(latestVerifiedApplication?.sex),
    barangay: toNullableString(user.barangay) ?? toNullableString(latestVerifiedApplication?.barangay),
    skills: isVolunteer
      ? toNullableString(user.skills) ?? toNullableString(latestVerifiedApplication?.skillsOther)
      : toNullableString(user.skills),
    avatarUrl: toNullableString(user.avatarUrl),
    stats: {
      completedTasks,
      volunteerHours,
      avgResponseTimeMinutes,
      verifiedTasks,
    },
  };
}
