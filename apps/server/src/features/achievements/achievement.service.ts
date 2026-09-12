import { Types } from "mongoose";
import { getProfileCompletionStatus } from "../auth/profileCompletion";
import { calculateVolunteerServiceStats } from "../dispatches/dispatch.volunteerStats";
import { DispatchOffer } from "../dispatches/dispatch.model";
import { EmergencyReport } from "../emergency/emergency.model";
import { ResponderTeam } from "../responderTeams/responderTeam.model";
import { User } from "../users/user.model";
import { VolunteerApplication } from "../volunteerApplications/volunteerApplication.model";
import { VolunteerReview } from "../volunteerReviews/volunteerReview.model";
import {
  ACHIEVEMENT_DEFINITIONS,
  TEAM_RESPONSE_TARGETS,
  TRUSTED_LIFELINE_RATING_TARGET,
  TRUSTED_LIFELINE_REVIEW_TARGET,
  TRUSTED_RESPONDER_RATING_TARGET,
  TRUSTED_RESPONDER_REVIEW_TARGET,
  VERIFIED_TASK_TARGETS,
  VOLUNTEER_HOUR_TARGETS,
} from "./achievement.constants";
import { UserAchievement } from "./achievement.model";
import { buildUserProgression } from "./achievement.progression";
import type {
  AchievementAudience,
  AchievementAwardMetadata,
  AchievementDefinition,
  AchievementDto,
  AchievementId,
  AchievementMetrics,
  AchievementProgressDto,
  AchievementsResponseDto,
} from "./achievement.types";
import { isAchievementId } from "./achievement.validation";

type EarnedAchievement = {
  achievementId: AchievementId;
  unlockedAt: Date;
};

type UserMetricsSource = {
  role?: unknown;
  volunteerStatus?: unknown;
  authProvider?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  contactNo?: unknown;
  gender?: unknown;
  barangay?: unknown;
  skills?: unknown;
};

type DispatchMetricOffer = {
  emergencyId?: unknown;
  status?: unknown;
  createdAt?: unknown;
  respondedAt?: unknown;
  completedAt?: unknown;
  verifiedAt?: unknown;
  updatedAt?: unknown;
  proofs?: unknown;
  chainRecord?: unknown;
  blockchain?: unknown;
  emergencySnapshot?: {
    emergencyType?: unknown;
    barangayName?: unknown;
  } | null;
};

type ReviewMetricsRow = { reviewCount?: unknown; averageRating?: unknown };
type ReportMetricsRow = {
  reportCount?: unknown;
  approvedReportCount?: unknown;
  approvedTypes?: unknown;
};
type TeamMetricsRow = { teamVerifiedEmergencyCount?: unknown };

const TERMINAL_STATUSES = new Set(["DECLINED", "CANCELLED", "DONE", "VERIFIED"]);
const SUCCESSFUL_TERMINAL_STATUSES = new Set(["DONE", "VERIFIED"]);

// The current emergency model has no RESCUE, EVACUATION, or RELIEF classification.
// These are the documented safe fallbacks from the product requirements.
const RESCUE_EMERGENCY_TYPE = "COLLAPSE";
const EVACUATION_EMERGENCY_TYPES = ["FLOOD", "TYPHOON"] as const;
const RELIEF_FALLBACK_RESPONSE_TARGET = 10;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function nonNegativeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function integer(value: unknown) {
  return Math.floor(nonNegativeNumber(value));
}

function roundRating(value: unknown) {
  return Math.round(nonNegativeNumber(value) * 10) / 10;
}

function normalizedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedUpper(value: unknown) {
  return normalizedString(value).toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasDate(value: unknown) {
  if (value instanceof Date) return Number.isFinite(value.getTime());
  if (typeof value !== "string" && typeof value !== "number") return false;
  return Number.isFinite(new Date(value).getTime());
}

function isTransactionHash(value: unknown) {
  return /^0x[a-fA-F0-9]{64}$/.test(normalizedString(value));
}

function hasValidBlockchainRecord(offer: DispatchMetricOffer) {
  if (normalizedUpper(offer.status) !== "VERIFIED") return false;

  if (isRecord(offer.blockchain)) {
    if (offer.blockchain.revoked === true) return false;
    const hasCurrentHash =
      isTransactionHash(offer.blockchain.reverifiedTxHash) ||
      isTransactionHash(offer.blockchain.verifiedTxHash);
    if (hasCurrentHash) return true;
  }

  if (!isRecord(offer.chainRecord) || offer.chainRecord.revoked === true) return false;
  return isTransactionHash(offer.chainRecord.txHash);
}

function hasCompletionProof(offer: DispatchMetricOffer) {
  if (normalizedUpper(offer.status) !== "VERIFIED" || !Array.isArray(offer.proofs)) {
    return false;
  }
  return offer.proofs.some((proof) => {
    if (!isRecord(proof)) return false;
    return Boolean(normalizedString(proof.url) || normalizedString(proof.fileHash));
  });
}

function audienceForRole(role: string): AchievementAudience | null {
  if (role === "VOLUNTEER") return "VOLUNTEER";
  if (role === "COMMUNITY") return "COMMUNITY";
  return null;
}

function definitionsForRole(role: string): readonly AchievementDefinition[] {
  const audience = audienceForRole(role);
  if (!audience) return [];
  return ACHIEVEMENT_DEFINITIONS.filter((definition) =>
    definition.audiences.includes(audience)
  );
}

function emptyMetrics(role: string, volunteerStatus: string): AchievementMetrics {
  return {
    role,
    volunteerStatus,
    profileComplete: false,
    hasVolunteerSkills: false,
    respondedDispatchCount: 0,
    terminalRespondedAssignments: 0,
    successfulTerminalAssignments: 0,
    completionRate: 0,
    completedTasks: 0,
    verifiedTasks: 0,
    volunteerHours: 0,
    verifiedVolunteerHours: 0,
    reviewCount: 0,
    averageRating: 0,
    verifiedProofTaskCount: 0,
    blockchainVerifiedTaskCount: 0,
    teamVerifiedEmergencyCount: 0,
    distinctVerifiedBarangays: 0,
    distinctVerifiedEmergencyTypes: 0,
    verifiedByEmergencyType: {},
    isActiveTeamLeader: false,
    reportCount: 0,
    approvedReportCount: 0,
    distinctApprovedReportTypes: 0,
  };
}

function getVerifiedTypeCount(metrics: AchievementMetrics, type: string) {
  return integer(metrics.verifiedByEmergencyType[type]);
}

function meetsMultiCondition(
  requirements: ReadonlyArray<{ current: number; target: number }>
) {
  return requirements.every(({ current, target }) => current >= target);
}

export function getEligibleAchievementIds(metrics: AchievementMetrics): AchievementId[] {
  const role = normalizedUpper(metrics.role);
  const eligibleDefinitions = definitionsForRole(role);

  return eligibleDefinitions
    .filter((definition) => {
      const id = definition.id;
      const verifiedTarget = VERIFIED_TASK_TARGETS[id];
      if (verifiedTarget !== undefined) return metrics.verifiedTasks >= verifiedTarget;

      const hourTarget = VOLUNTEER_HOUR_TARGETS[id];
      if (hourTarget !== undefined) return metrics.volunteerHours >= hourTarget;

      const teamTarget = TEAM_RESPONSE_TARGETS[id];
      if (teamTarget !== undefined) return metrics.teamVerifiedEmergencyCount >= teamTarget;

      switch (id) {
        case "verified-volunteer":
          return normalizedUpper(metrics.volunteerStatus) === "APPROVED";
        case "ready-to-respond":
          return metrics.respondedDispatchCount >= 1;
        case "trusted-responder":
          return meetsMultiCondition([
            { current: metrics.reviewCount, target: TRUSTED_RESPONDER_REVIEW_TARGET },
            { current: metrics.averageRating, target: TRUSTED_RESPONDER_RATING_TARGET },
          ]);
        case "dependable-hand":
          return metrics.terminalRespondedAssignments >= 10 && metrics.completionRate >= 0.9;
        case "always-ready":
          return metrics.respondedDispatchCount >= 25;
        case "trusted-lifeline":
          return meetsMultiCondition([
            { current: metrics.reviewCount, target: TRUSTED_LIFELINE_REVIEW_TARGET },
            { current: metrics.averageRating, target: TRUSTED_LIFELINE_RATING_TARGET },
          ]);
        case "response-certified":
          return metrics.verifiedProofTaskCount >= 1;
        case "chain-of-trust":
          return metrics.blockchainVerifiedTaskCount >= 1;
        case "immutable-impact":
          return metrics.blockchainVerifiedTaskCount >= 25;
        case "community-connector":
          return metrics.distinctVerifiedBarangays >= 3;
        case "response-leader":
          return metrics.isActiveTeamLeader && metrics.verifiedTasks >= 10;
        case "first-step":
        case "community-ready":
          return metrics.profileComplete;
        case "getting-started":
          return metrics.profileComplete && metrics.hasVolunteerSkills;
        case "medical-aid-responder":
          return getVerifiedTypeCount(metrics, "MEDICAL") >= 1;
        case "flood-response-ready":
          return getVerifiedTypeCount(metrics, "FLOOD") >= 1;
        case "fire-response-ready":
          return getVerifiedTypeCount(metrics, "FIRE") >= 1;
        case "rescue-ready":
          return getVerifiedTypeCount(metrics, RESCUE_EMERGENCY_TYPE) >= 1;
        case "evacuation-supporter":
          return EVACUATION_EMERGENCY_TYPES.reduce(
            (total, type) => total + getVerifiedTypeCount(metrics, type),
            0
          ) >= 5;
        case "relief-coordinator":
          return (
            metrics.isActiveTeamLeader &&
            EVACUATION_EMERGENCY_TYPES.reduce(
              (total, type) => total + getVerifiedTypeCount(metrics, type),
              0
            ) >= RELIEF_FALLBACK_RESPONSE_TARGET
          );
        case "navigation-specialist":
          return metrics.distinctVerifiedBarangays >= 5;
        case "field-support-specialist":
          return metrics.distinctVerifiedEmergencyTypes >= 4;
        case "safety-aware":
          return metrics.reportCount >= 1;
        case "verified-reporter":
          return metrics.approvedReportCount >= 1;
        case "community-watch":
          return metrics.approvedReportCount >= 5;
        case "prepared-citizen":
          return metrics.approvedReportCount >= 10 && metrics.distinctApprovedReportTypes >= 3;
        case "lifeline-supporter":
          return metrics.approvedReportCount >= 25;
        case "heart-of-lifeline":
          return meetsMultiCondition([
            { current: metrics.verifiedTasks, target: 50 },
            { current: metrics.volunteerHours, target: 100 },
          ]);
        case "guardian-of-the-community":
          return meetsMultiCondition([
            { current: metrics.verifiedTasks, target: 100 },
            { current: metrics.volunteerHours, target: 250 },
          ]);
        case "beacon-of-hope":
          return meetsMultiCondition([
            { current: metrics.verifiedTasks, target: 200 },
            { current: metrics.volunteerHours, target: 500 },
            { current: metrics.reviewCount, target: 20 },
            { current: metrics.averageRating, target: 4.7 },
          ]);
        case "above-and-beyond":
          return meetsMultiCondition([
            { current: metrics.verifiedTasks, target: 300 },
            { current: metrics.volunteerHours, target: 750 },
            { current: metrics.reviewCount, target: 30 },
            { current: metrics.averageRating, target: 4.8 },
          ]);
        case "pillar-of-service":
          return meetsMultiCondition([
            { current: metrics.verifiedTasks, target: 500 },
            { current: metrics.volunteerHours, target: 1000 },
            { current: metrics.reviewCount, target: 50 },
            { current: metrics.averageRating, target: 4.8 },
          ]);
        default:
          return false;
      }
    })
    .map((definition) => definition.id);
}

function numericProgress(current: number, target: number, unit: string): AchievementProgressDto {
  return {
    current,
    target,
    percent: target > 0 ? clampPercent((current / target) * 100) : 0,
    label: `${current} / ${target} ${unit}`,
  };
}

type ProgressRequirement = {
  current: number;
  target: number;
  label: string;
};

function multiProgress(requirements: readonly ProgressRequirement[]): AchievementProgressDto {
  const percentages = requirements.map(({ current, target }) =>
    target > 0 ? (current / target) * 100 : 0
  );
  const firstUnmet = requirements.find(({ current, target }) => current < target) ?? requirements[0];
  return {
    current: firstUnmet.current,
    target: firstUnmet.target,
    percent: clampPercent(Math.min(...percentages)),
    label: firstUnmet.label,
  };
}

function ratingLabel(value: number) {
  return value.toFixed(1);
}

function trustProgress(metrics: AchievementMetrics, reviews: number, rating: number) {
  return multiProgress([
    {
      current: metrics.reviewCount,
      target: reviews,
      label: `${metrics.reviewCount} / ${reviews} reviews`,
    },
    {
      current: metrics.averageRating,
      target: rating,
      label: `${ratingLabel(metrics.averageRating)} / ${ratingLabel(rating)} average rating`,
    },
  ]);
}

function leadershipProgress(metrics: AchievementMetrics, responseTarget: number) {
  return multiProgress([
    {
      current: metrics.isActiveTeamLeader ? 1 : 0,
      target: 1,
      label: metrics.isActiveTeamLeader ? "Leadership confirmed" : "Active team leadership required",
    },
    {
      current: metrics.verifiedTasks,
      target: responseTarget,
      label: `${metrics.verifiedTasks} / ${responseTarget} verified tasks`,
    },
  ]);
}

function recognitionProgress(
  metrics: AchievementMetrics,
  targets: { tasks: number; hours: number; reviews?: number; rating?: number }
) {
  const requirements: ProgressRequirement[] = [
    { current: metrics.verifiedTasks, target: targets.tasks, label: `${metrics.verifiedTasks} / ${targets.tasks} verified tasks` },
    { current: metrics.volunteerHours, target: targets.hours, label: `${metrics.volunteerHours} / ${targets.hours} service hours` },
  ];
  if (targets.reviews !== undefined) {
    requirements.push({ current: metrics.reviewCount, target: targets.reviews, label: `${metrics.reviewCount} / ${targets.reviews} reviews` });
  }
  if (targets.rating !== undefined) {
    requirements.push({ current: metrics.averageRating, target: targets.rating, label: `${ratingLabel(metrics.averageRating)} / ${ratingLabel(targets.rating)} average rating` });
  }
  return multiProgress(requirements);
}

function buildLockedProgress(id: AchievementId, metrics: AchievementMetrics): AchievementProgressDto {
  const verifiedTarget = VERIFIED_TASK_TARGETS[id];
  if (verifiedTarget !== undefined) return numericProgress(metrics.verifiedTasks, verifiedTarget, "verified tasks");

  const hourTarget = VOLUNTEER_HOUR_TARGETS[id];
  if (hourTarget !== undefined) return numericProgress(metrics.volunteerHours, hourTarget, "service hours");

  const teamTarget = TEAM_RESPONSE_TARGETS[id];
  if (teamTarget !== undefined) return numericProgress(metrics.teamVerifiedEmergencyCount, teamTarget, "collaborative responses");

  switch (id) {
    case "verified-volunteer": {
      const current = normalizedUpper(metrics.volunteerStatus) === "APPROVED" ? 1 : 0;
      return { current, target: 1, percent: current * 100, label: current ? "Completed" : "Verification required" };
    }
    case "ready-to-respond":
      return numericProgress(Math.min(1, metrics.respondedDispatchCount), 1, "response");
    case "trusted-responder":
      return trustProgress(metrics, TRUSTED_RESPONDER_REVIEW_TARGET, TRUSTED_RESPONDER_RATING_TARGET);
    case "dependable-hand": {
      const completionPercent = Math.round(metrics.completionRate * 100);
      const percent = clampPercent(Math.min(
        (metrics.terminalRespondedAssignments / 10) * 100,
        (metrics.completionRate / 0.9) * 100
      ));
      return metrics.terminalRespondedAssignments < 10
        ? { current: metrics.terminalRespondedAssignments, target: 10, percent, label: `${metrics.terminalRespondedAssignments} / 10 completed assignment records` }
        : { current: completionPercent, target: 90, percent, label: `${completionPercent}% / 90% completion rate` };
    }
    case "always-ready":
      return numericProgress(metrics.respondedDispatchCount, 25, "responses");
    case "trusted-lifeline":
      return trustProgress(metrics, TRUSTED_LIFELINE_REVIEW_TARGET, TRUSTED_LIFELINE_RATING_TARGET);
    case "response-certified":
      return numericProgress(metrics.verifiedProofTaskCount, 1, "verified proof response");
    case "chain-of-trust":
      return numericProgress(metrics.blockchainVerifiedTaskCount, 1, "blockchain-verified response");
    case "immutable-impact":
      return numericProgress(metrics.blockchainVerifiedTaskCount, 25, "blockchain-verified responses");
    case "community-connector":
      return numericProgress(metrics.distinctVerifiedBarangays, 3, "communities");
    case "response-leader":
      return leadershipProgress(metrics, 10);
    case "first-step":
    case "community-ready":
      return numericProgress(metrics.profileComplete ? 1 : 0, 1, "completed profile");
    case "getting-started":
      return multiProgress([
        { current: metrics.profileComplete ? 1 : 0, target: 1, label: "Complete your profile" },
        { current: metrics.hasVolunteerSkills ? 1 : 0, target: 1, label: "Register at least one responder skill" },
      ]);
    case "medical-aid-responder":
      return numericProgress(getVerifiedTypeCount(metrics, "MEDICAL"), 1, "verified medical response");
    case "flood-response-ready":
      return numericProgress(getVerifiedTypeCount(metrics, "FLOOD"), 1, "verified flood response");
    case "fire-response-ready":
      return numericProgress(getVerifiedTypeCount(metrics, "FIRE"), 1, "verified fire response");
    case "rescue-ready":
      return numericProgress(getVerifiedTypeCount(metrics, RESCUE_EMERGENCY_TYPE), 1, "verified rescue response");
    case "evacuation-supporter":
      return numericProgress(EVACUATION_EMERGENCY_TYPES.reduce((sum, type) => sum + getVerifiedTypeCount(metrics, type), 0), 5, "verified evacuation responses");
    case "relief-coordinator": {
      const disasterResponses = EVACUATION_EMERGENCY_TYPES.reduce((sum, type) => sum + getVerifiedTypeCount(metrics, type), 0);
      return multiProgress([
        { current: metrics.isActiveTeamLeader ? 1 : 0, target: 1, label: metrics.isActiveTeamLeader ? "Leadership confirmed" : "Active team leadership required" },
        { current: disasterResponses, target: RELIEF_FALLBACK_RESPONSE_TARGET, label: `${disasterResponses} / ${RELIEF_FALLBACK_RESPONSE_TARGET} verified flood or typhoon responses` },
      ]);
    }
    case "navigation-specialist":
      return numericProgress(metrics.distinctVerifiedBarangays, 5, "communities");
    case "field-support-specialist":
      return numericProgress(metrics.distinctVerifiedEmergencyTypes, 4, "emergency types");
    case "safety-aware":
      return numericProgress(metrics.reportCount, 1, "emergency report");
    case "verified-reporter":
      return numericProgress(metrics.approvedReportCount, 1, "verified report");
    case "community-watch":
      return numericProgress(metrics.approvedReportCount, 5, "verified reports");
    case "prepared-citizen":
      return multiProgress([
        { current: metrics.approvedReportCount, target: 10, label: `${metrics.approvedReportCount} / 10 verified reports` },
        { current: metrics.distinctApprovedReportTypes, target: 3, label: `${metrics.distinctApprovedReportTypes} / 3 emergency types` },
      ]);
    case "lifeline-supporter":
      return numericProgress(metrics.approvedReportCount, 25, "verified reports");
    case "heart-of-lifeline":
      return recognitionProgress(metrics, { tasks: 50, hours: 100 });
    case "guardian-of-the-community":
      return recognitionProgress(metrics, { tasks: 100, hours: 250 });
    case "beacon-of-hope":
      return recognitionProgress(metrics, { tasks: 200, hours: 500, reviews: 20, rating: 4.7 });
    case "above-and-beyond":
      return recognitionProgress(metrics, { tasks: 300, hours: 750, reviews: 30, rating: 4.8 });
    case "pillar-of-service":
      return recognitionProgress(metrics, { tasks: 500, hours: 1000, reviews: 50, rating: 4.8 });
    default:
      return { current: 0, target: 1, percent: 0, label: "Not yet unlocked" };
  }
}

export function buildAchievementsResponse(
  metrics: AchievementMetrics,
  earnedAchievements: readonly EarnedAchievement[]
): AchievementsResponseDto {
  const earnedById = new Map<AchievementId, Date>();
  for (const earned of earnedAchievements) {
    if (!isAchievementId(earned.achievementId)) continue;
    const unlockedAt = new Date(earned.unlockedAt);
    if (Number.isFinite(unlockedAt.getTime())) earnedById.set(earned.achievementId, unlockedAt);
  }

  const achievements: AchievementDto[] = definitionsForRole(normalizedUpper(metrics.role)).map(
    ({ audiences: _audiences, ...definition }) => {
      const unlockedAt = earnedById.get(definition.id) ?? null;
      return {
        ...definition,
        unlocked: unlockedAt !== null,
        unlockedAt: unlockedAt?.toISOString() ?? null,
        progress: unlockedAt
          ? { current: 1, target: 1, percent: 100, label: "Unlocked" }
          : buildLockedProgress(definition.id, metrics),
      };
    }
  );

  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const total = achievements.length;
  const role = normalizedUpper(metrics.role);
  const supportedRole = audienceForRole(role) !== null;
  const volunteerProgression = role === "VOLUNTEER";
  return {
    summary: {
      unlocked,
      total,
      percent: total > 0 ? clampPercent((unlocked / total) * 100) : 0,
    },
    progression: buildUserProgression({
      profileComplete: supportedRole && metrics.profileComplete,
      approvedVolunteer:
        volunteerProgression && normalizedUpper(metrics.volunteerStatus) === "APPROVED",
      verifiedTasks: volunteerProgression ? metrics.verifiedTasks : 0,
      verifiedVolunteerHours: volunteerProgression ? metrics.verifiedVolunteerHours : 0,
      approvedReports: supportedRole ? metrics.approvedReportCount : 0,
      permanentAchievements: supportedRole ? earnedById.size : 0,
    }),
    achievements,
  };
}

function buildAwardMetadata(id: AchievementId, metrics: AchievementMetrics): AchievementAwardMetadata | undefined {
  if (VERIFIED_TASK_TARGETS[id] !== undefined) return { verifiedTasks: metrics.verifiedTasks };
  if (id === "trusted-responder" || id === "trusted-lifeline") {
    return { reviewCount: metrics.reviewCount, averageRating: metrics.averageRating };
  }
  return undefined;
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === 11000);
}

async function loadTeamVerifiedEmergencyCount(userId: Types.ObjectId) {
  const rows = await DispatchOffer.aggregate<TeamMetricsRow>([
    { $match: { volunteerId: userId, status: "VERIFIED" } },
    { $group: { _id: "$emergencyId" } },
    {
      $lookup: {
        from: DispatchOffer.collection.name,
        let: { emergencyId: "$_id" },
        pipeline: [
          {
            $match: {
              status: "VERIFIED",
              $expr: {
                $and: [
                  { $eq: ["$emergencyId", "$$emergencyId"] },
                  { $ne: ["$volunteerId", userId] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "otherVerifiedResponders",
      },
    },
    { $match: { "otherVerifiedResponders.0": { $exists: true } } },
    { $count: "teamVerifiedEmergencyCount" },
  ]);
  return integer(rows[0]?.teamVerifiedEmergencyCount);
}

async function loadReportMetrics(userId: Types.ObjectId) {
  const rows = await EmergencyReport.aggregate<ReportMetricsRow>([
    { $match: { reportedBy: userId } },
    {
      $group: {
        _id: null,
        reportCount: { $sum: 1 },
        approvedReportCount: {
          $sum: { $cond: [{ $eq: ["$verification.status", "approved"] }, 1, 0] },
        },
        approvedTypes: {
          $addToSet: {
            $cond: [
              { $eq: ["$verification.status", "approved"] },
              { $toUpper: { $trim: { input: { $ifNull: ["$emergencyType", ""] } } } },
              "$$REMOVE",
            ],
          },
        },
      },
    },
  ]);
  const row = rows[0];
  const approvedTypes = Array.isArray(row?.approvedTypes)
    ? row.approvedTypes.filter((value) => normalizedString(value).length > 0)
    : [];
  return {
    reportCount: integer(row?.reportCount),
    approvedReportCount: integer(row?.approvedReportCount),
    distinctApprovedReportTypes: new Set(approvedTypes.map(normalizedUpper)).size,
  };
}

export async function loadAchievementMetrics(
  userId: Types.ObjectId,
  user: UserMetricsSource
): Promise<AchievementMetrics> {
  const role = normalizedUpper(user.role);
  const volunteerStatus = normalizedUpper(user.volunteerStatus);
  const metrics = emptyMetrics(role, volunteerStatus);
  const profileStatus = getProfileCompletionStatus({
    role,
    authProvider: normalizedString(user.authProvider),
    firstName: normalizedString(user.firstName),
    lastName: normalizedString(user.lastName),
    contactNo: normalizedString(user.contactNo),
    gender: normalizedString(user.gender),
    barangay: normalizedString(user.barangay),
  });
  metrics.profileComplete = !profileStatus.profileCompletionRequired;

  const reportPromise = role === "VOLUNTEER" || role === "COMMUNITY"
    ? loadReportMetrics(userId)
    : Promise.resolve({ reportCount: 0, approvedReportCount: 0, distinctApprovedReportTypes: 0 });

  if (role !== "VOLUNTEER") {
    Object.assign(metrics, await reportPromise);
    return metrics;
  }

  const [offersRaw, reviewRows, teamCount, leader, verifiedApplication, reportMetrics] = await Promise.all([
    DispatchOffer.find({ volunteerId: userId })
      .select("emergencyId status createdAt respondedAt completedAt verifiedAt updatedAt proofs chainRecord blockchain emergencySnapshot.emergencyType emergencySnapshot.barangayName")
      .lean(),
    VolunteerReview.aggregate<ReviewMetricsRow>([
      { $match: { volunteerId: userId } },
      { $group: { _id: null, reviewCount: { $sum: 1 }, averageRating: { $avg: "$rating" } } },
    ]),
    loadTeamVerifiedEmergencyCount(userId),
    ResponderTeam.exists({ leaderId: userId, isActive: true }),
    VolunteerApplication.findOne({ userId, status: "verified" })
      .select("skillsOther createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    reportPromise,
  ]);

  const offers = offersRaw as unknown as DispatchMetricOffer[];
  const serviceStats = calculateVolunteerServiceStats(offers);
  const barangays = new Set<string>();
  const emergencyTypes = new Set<string>();
  const verifiedByEmergencyType: Record<string, number> = {};

  for (const offer of offers) {
    const status = normalizedUpper(offer.status);
    const responded = hasDate(offer.respondedAt);
    if (responded) metrics.respondedDispatchCount += 1;
    if (responded && TERMINAL_STATUSES.has(status)) {
      metrics.terminalRespondedAssignments += 1;
      if (SUCCESSFUL_TERMINAL_STATUSES.has(status)) metrics.successfulTerminalAssignments += 1;
    }
    if (hasCompletionProof(offer)) metrics.verifiedProofTaskCount += 1;
    if (hasValidBlockchainRecord(offer)) metrics.blockchainVerifiedTaskCount += 1;

    if (status !== "VERIFIED") continue;
    const barangay = normalizedString(offer.emergencySnapshot?.barangayName).toLocaleLowerCase("en-US");
    if (barangay) barangays.add(barangay);
    const emergencyType = normalizedUpper(offer.emergencySnapshot?.emergencyType);
    if (emergencyType) {
      emergencyTypes.add(emergencyType);
      verifiedByEmergencyType[emergencyType] = (verifiedByEmergencyType[emergencyType] ?? 0) + 1;
    }
  }

  const reviewRow = reviewRows[0];
  metrics.completionRate = metrics.terminalRespondedAssignments > 0
    ? metrics.successfulTerminalAssignments / metrics.terminalRespondedAssignments
    : 0;
  metrics.completedTasks = serviceStats.completedTasks;
  metrics.verifiedTasks = serviceStats.verifiedTasks;
  metrics.volunteerHours = serviceStats.volunteerHours;
  metrics.verifiedVolunteerHours = serviceStats.verifiedVolunteerHours;
  metrics.reviewCount = integer(reviewRow?.reviewCount);
  metrics.averageRating = roundRating(reviewRow?.averageRating);
  metrics.teamVerifiedEmergencyCount = teamCount;
  metrics.distinctVerifiedBarangays = barangays.size;
  metrics.distinctVerifiedEmergencyTypes = emergencyTypes.size;
  metrics.verifiedByEmergencyType = verifiedByEmergencyType;
  metrics.isActiveTeamLeader = Boolean(leader);
  metrics.hasVolunteerSkills = Boolean(
    normalizedString(user.skills) || normalizedString(verifiedApplication?.skillsOther)
  );
  Object.assign(metrics, reportMetrics);
  return metrics;
}

export async function evaluateAndAwardAchievements(userId: string): Promise<AchievementsResponseDto | null> {
  if (!Types.ObjectId.isValid(userId)) return null;

  const userObjectId = new Types.ObjectId(userId);
  const [user, previouslyEarnedRows] = await Promise.all([
    User.findById(userObjectId)
      .select("role volunteerStatus authProvider firstName lastName contactNo gender barangay skills")
      .lean(),
    UserAchievement.find({ userId: userObjectId }).select("achievementId unlockedAt").lean(),
  ]);
  if (!user) return null;

  const metrics = await loadAchievementMetrics(userObjectId, user);
  const alreadyEarnedIds = new Set<AchievementId>();
  for (const row of previouslyEarnedRows) {
    if (isAchievementId(row.achievementId)) alreadyEarnedIds.add(row.achievementId);
  }

  const newlyEligibleIds = getEligibleAchievementIds(metrics).filter((id) => !alreadyEarnedIds.has(id));
  if (newlyEligibleIds.length > 0) {
    const unlockedAt = new Date();
    const operations = newlyEligibleIds.map((achievementId) => {
      const metadata = buildAwardMetadata(achievementId, metrics);
      return {
        updateOne: {
          filter: { userId: userObjectId, achievementId },
          update: { $setOnInsert: { userId: userObjectId, achievementId, unlockedAt, ...(metadata ? { metadata } : {}) } },
          upsert: true,
        },
      };
    });
    try {
      await UserAchievement.bulkWrite(operations, { ordered: false });
    } catch (error: unknown) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  const earnedRows = await UserAchievement.find({ userId: userObjectId }).select("achievementId unlockedAt").lean();
  const earnedAchievements: EarnedAchievement[] = [];
  for (const row of earnedRows) {
    if (!isAchievementId(row.achievementId)) continue;
    const unlockedAt = new Date(row.unlockedAt);
    if (Number.isFinite(unlockedAt.getTime())) earnedAchievements.push({ achievementId: row.achievementId, unlockedAt });
  }
  return buildAchievementsResponse(metrics, earnedAchievements);
}
