import { Types } from "mongoose";
import { DispatchOffer } from "../dispatches/dispatch.model";
import { User } from "../users/user.model";
import { VolunteerReview } from "../volunteerReviews/volunteerReview.model";
import {
  ACHIEVEMENT_DEFINITIONS,
  TRUSTED_RESPONDER_RATING_TARGET,
  TRUSTED_RESPONDER_REVIEW_TARGET,
  VERIFIED_TASK_TARGETS,
} from "./achievement.constants";
import { UserAchievement } from "./achievement.model";
import type {
  AchievementAwardMetadata,
  AchievementDto,
  AchievementEvaluationStats,
  AchievementId,
  AchievementProgressDto,
  AchievementsResponseDto,
} from "./achievement.types";
import { isAchievementId } from "./achievement.validation";

type EarnedAchievement = {
  achievementId: AchievementId;
  unlockedAt: Date;
};

type DispatchAchievementStatsRow = {
  verifiedTasks?: number;
  respondedAssignments?: number;
};

type ReviewAchievementStatsRow = {
  reviewCount?: number;
  averageRating?: number;
};

const ZERO_STATS: AchievementEvaluationStats = {
  role: "",
  volunteerStatus: "",
  respondedAssignments: 0,
  verifiedTasks: 0,
  reviewCount: 0,
  averageRating: 0,
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function nonNegativeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function roundRating(value: unknown) {
  return Math.round(nonNegativeNumber(value) * 10) / 10;
}

function ratingLabel(value: number) {
  return value.toFixed(1);
}

export function getEligibleAchievementIds(stats: AchievementEvaluationStats): AchievementId[] {
  if (stats.role.toUpperCase() !== "VOLUNTEER") return [];

  const eligible: AchievementId[] = [];
  if (stats.volunteerStatus.toUpperCase() === "APPROVED") {
    eligible.push("verified-volunteer");
  }
  if (stats.respondedAssignments >= 1) {
    eligible.push("ready-to-respond");
  }

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const target = VERIFIED_TASK_TARGETS[definition.id];
    if (target !== undefined && stats.verifiedTasks >= target) {
      eligible.push(definition.id);
    }
  }

  if (
    stats.reviewCount >= TRUSTED_RESPONDER_REVIEW_TARGET &&
    stats.averageRating >= TRUSTED_RESPONDER_RATING_TARGET
  ) {
    eligible.push("trusted-responder");
  }

  return eligible;
}

function buildLockedProgress(
  achievementId: AchievementId,
  stats: AchievementEvaluationStats
): AchievementProgressDto {
  if (achievementId === "verified-volunteer") {
    const current = stats.volunteerStatus.toUpperCase() === "APPROVED" ? 1 : 0;
    return {
      current,
      target: 1,
      percent: current * 100,
      label: current === 1 ? "Completed" : "Verification required",
    };
  }

  if (achievementId === "ready-to-respond") {
    const current = Math.min(1, stats.respondedAssignments);
    return {
      current,
      target: 1,
      percent: current * 100,
      label: `${current} / 1 response`,
    };
  }

  const verifiedTaskTarget = VERIFIED_TASK_TARGETS[achievementId];
  if (verifiedTaskTarget !== undefined) {
    return {
      current: stats.verifiedTasks,
      target: verifiedTaskTarget,
      percent: clampPercent((stats.verifiedTasks / verifiedTaskTarget) * 100),
      label: `${stats.verifiedTasks} / ${verifiedTaskTarget} verified tasks`,
    };
  }

  if (stats.reviewCount < TRUSTED_RESPONDER_REVIEW_TARGET) {
    return {
      current: stats.reviewCount,
      target: TRUSTED_RESPONDER_REVIEW_TARGET,
      percent: clampPercent((stats.reviewCount / TRUSTED_RESPONDER_REVIEW_TARGET) * 100),
      label: `${stats.reviewCount} / ${TRUSTED_RESPONDER_REVIEW_TARGET} reviews`,
    };
  }

  return {
    current: stats.averageRating,
    target: TRUSTED_RESPONDER_RATING_TARGET,
    percent: clampPercent((stats.averageRating / TRUSTED_RESPONDER_RATING_TARGET) * 100),
    label: `${ratingLabel(stats.averageRating)} / ${ratingLabel(TRUSTED_RESPONDER_RATING_TARGET)} average rating`,
  };
}

export function buildAchievementsResponse(
  stats: AchievementEvaluationStats,
  earnedAchievements: readonly EarnedAchievement[]
): AchievementsResponseDto {
  const earnedById = new Map<AchievementId, Date>();
  for (const earned of earnedAchievements) {
    if (!isAchievementId(earned.achievementId)) continue;
    const unlockedAt = new Date(earned.unlockedAt);
    if (!Number.isFinite(unlockedAt.getTime())) continue;
    earnedById.set(earned.achievementId, unlockedAt);
  }

  const achievements: AchievementDto[] = ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const unlockedAt = earnedById.get(definition.id) ?? null;
    const unlocked = unlockedAt !== null;

    return {
      ...definition,
      unlocked,
      unlockedAt: unlockedAt?.toISOString() ?? null,
      progress: unlocked
        ? { current: 1, target: 1, percent: 100, label: "Unlocked" }
        : buildLockedProgress(definition.id, stats),
    };
  });

  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const total = achievements.length;

  return {
    summary: {
      unlocked,
      total,
      percent: total > 0 ? clampPercent((unlocked / total) * 100) : 0,
    },
    achievements,
  };
}

function buildAwardMetadata(
  achievementId: AchievementId,
  stats: AchievementEvaluationStats
): AchievementAwardMetadata | undefined {
  if (VERIFIED_TASK_TARGETS[achievementId] !== undefined) {
    return { verifiedTasks: stats.verifiedTasks };
  }

  if (achievementId === "trusted-responder") {
    return {
      reviewCount: stats.reviewCount,
      averageRating: stats.averageRating,
    };
  }

  return undefined;
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
  );
}

async function loadVolunteerStats(
  userId: Types.ObjectId,
  role: string,
  volunteerStatus: string
): Promise<AchievementEvaluationStats> {
  if (role.toUpperCase() !== "VOLUNTEER") {
    return { ...ZERO_STATS, role, volunteerStatus };
  }

  const [dispatchRows, reviewRows] = await Promise.all([
    DispatchOffer.aggregate<DispatchAchievementStatsRow>([
      { $match: { volunteerId: userId } },
      {
        $group: {
          _id: null,
          verifiedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0] },
          },
          respondedAssignments: {
            $sum: { $cond: [{ $eq: [{ $type: "$respondedAt" }, "date"] }, 1, 0] },
          },
        },
      },
    ]),
    VolunteerReview.aggregate<ReviewAchievementStatsRow>([
      { $match: { volunteerId: userId } },
      {
        $group: {
          _id: null,
          reviewCount: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]),
  ]);

  const dispatchStats = dispatchRows[0];
  const reviewStats = reviewRows[0];

  return {
    role,
    volunteerStatus,
    respondedAssignments: Math.floor(nonNegativeNumber(dispatchStats?.respondedAssignments)),
    verifiedTasks: Math.floor(nonNegativeNumber(dispatchStats?.verifiedTasks)),
    reviewCount: Math.floor(nonNegativeNumber(reviewStats?.reviewCount)),
    averageRating: roundRating(reviewStats?.averageRating),
  };
}

export async function evaluateAndAwardAchievements(
  userId: string
): Promise<AchievementsResponseDto | null> {
  if (!Types.ObjectId.isValid(userId)) return null;

  const userObjectId = new Types.ObjectId(userId);
  const [user, previouslyEarnedRows] = await Promise.all([
    User.findById(userObjectId).select("role volunteerStatus").lean(),
    UserAchievement.find({ userId: userObjectId })
      .select("achievementId unlockedAt")
      .lean(),
  ]);

  if (!user) return null;

  const stats = await loadVolunteerStats(
    userObjectId,
    String(user.role ?? ""),
    String(user.volunteerStatus ?? "")
  );
  const alreadyEarnedIds = new Set<AchievementId>();
  for (const row of previouslyEarnedRows) {
    if (isAchievementId(row.achievementId)) alreadyEarnedIds.add(row.achievementId);
  }

  const newlyEligibleIds = getEligibleAchievementIds(stats).filter(
    (achievementId) => !alreadyEarnedIds.has(achievementId)
  );

  if (newlyEligibleIds.length > 0) {
    const unlockedAt = new Date();
    const operations = newlyEligibleIds.map((achievementId) => {
      const metadata = buildAwardMetadata(achievementId, stats);
      return {
        updateOne: {
          filter: { userId: userObjectId, achievementId },
          update: {
            $setOnInsert: {
              userId: userObjectId,
              achievementId,
              unlockedAt,
              ...(metadata ? { metadata } : {}),
            },
          },
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

  const earnedRows = await UserAchievement.find({ userId: userObjectId })
    .select("achievementId unlockedAt")
    .lean();
  const earnedAchievements: EarnedAchievement[] = [];

  for (const row of earnedRows) {
    if (!isAchievementId(row.achievementId)) continue;
    const unlockedAt = new Date(row.unlockedAt);
    if (!Number.isFinite(unlockedAt.getTime())) continue;
    earnedAchievements.push({ achievementId: row.achievementId, unlockedAt });
  }

  return buildAchievementsResponse(stats, earnedAchievements);
}
