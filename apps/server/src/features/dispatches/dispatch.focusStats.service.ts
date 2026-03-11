import { Types } from "mongoose";
import { DispatchOffer } from "./dispatch.model";

const FOCUS_STATS_DEFAULT_GOALS = {
  respondedGoal: 5,
  volunteerHoursGoal: 4,
  completedGoal: 5,
} as const;

export type DispatchFocusStats = {
  range: "today";
  respondedCount: number;
  respondedGoal: number;
  volunteerHours: number;
  volunteerHoursGoal: number;
  completedCount: number;
  completedGoal: number;
  donutPercent: number;
};

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getMyDispatchFocusStats(volunteerUserId: string): Promise<DispatchFocusStats> {
  if (!Types.ObjectId.isValid(volunteerUserId)) {
    throw new Error("Invalid volunteer id");
  }

  const volunteerId = new Types.ObjectId(volunteerUserId);
  const { start, end } = getTodayBounds();

  const [respondedCount, completedCount, durationOffers] = await Promise.all([
    DispatchOffer.countDocuments({
      volunteerId,
      status: { $in: ["ACCEPTED", "DECLINED", "DONE", "VERIFIED"] },
      respondedAt: { $gte: start, $lt: end },
    }),
    DispatchOffer.countDocuments({
      volunteerId,
      status: "VERIFIED",
      verifiedAt: { $gte: start, $lt: end },
    }),
    DispatchOffer.find({
      volunteerId,
      status: { $in: ["DONE", "VERIFIED"] },
      respondedAt: { $gte: start, $lt: end },
    })
      .select("respondedAt completedAt verifiedAt updatedAt")
      .lean(),
  ]);

  let volunteerHours = 0;
  for (const offer of durationOffers) {
    const respondedAt = offer.respondedAt ? new Date(offer.respondedAt) : null;
    if (!respondedAt || !Number.isFinite(respondedAt.getTime())) continue;

    const completedAt = offer.completedAt ? new Date(offer.completedAt) : null;
    const verifiedAt = offer.verifiedAt ? new Date(offer.verifiedAt) : null;
    const updatedAt = offer.updatedAt ? new Date(offer.updatedAt) : null;
    const endAt = completedAt ?? verifiedAt ?? updatedAt;
    if (!endAt || !Number.isFinite(endAt.getTime())) continue;

    volunteerHours += Math.max(0, (endAt.getTime() - respondedAt.getTime()) / 3_600_000);
  }

  const roundedVolunteerHours = roundToOneDecimal(volunteerHours);
  const respondedProgress = clamp(respondedCount / FOCUS_STATS_DEFAULT_GOALS.respondedGoal, 0, 1);
  const volunteerHoursProgress = clamp(
    roundedVolunteerHours / FOCUS_STATS_DEFAULT_GOALS.volunteerHoursGoal,
    0,
    1
  );
  const completedProgress = clamp(completedCount / FOCUS_STATS_DEFAULT_GOALS.completedGoal, 0, 1);
  const donutPercent = Math.round(((respondedProgress + volunteerHoursProgress + completedProgress) / 3) * 100);

  return {
    range: "today",
    respondedCount,
    respondedGoal: FOCUS_STATS_DEFAULT_GOALS.respondedGoal,
    volunteerHours: roundedVolunteerHours,
    volunteerHoursGoal: FOCUS_STATS_DEFAULT_GOALS.volunteerHoursGoal,
    completedCount,
    completedGoal: FOCUS_STATS_DEFAULT_GOALS.completedGoal,
    donutPercent,
  };
}
