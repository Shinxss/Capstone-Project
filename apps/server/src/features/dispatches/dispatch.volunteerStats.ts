import { Types } from "mongoose";
import { DispatchOffer } from "./dispatch.model";

type VolunteerStatsOffer = {
  status?: unknown;
  createdAt?: unknown;
  respondedAt?: unknown;
  completedAt?: unknown;
  verifiedAt?: unknown;
  updatedAt?: unknown;
};

export type VolunteerServiceStats = {
  completedTasks: number;
  verifiedTasks: number;
  volunteerHours: number;
  avgResponseTimeMinutes: number | null;
};

function validDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

/**
 * Canonical lifetime service-stat calculation shared by profile summaries and achievements.
 * Volunteer hours preserve the production formula: respondedAt -> completedAt, verifiedAt,
 * or updatedAt (in that order) for DONE/VERIFIED assignments only.
 */
export function calculateVolunteerServiceStats(
  offers: readonly VolunteerStatsOffer[]
): VolunteerServiceStats {
  let completedTasks = 0;
  let verifiedTasks = 0;
  let totalVolunteerHours = 0;
  let responseDeltaSum = 0;
  let responseDeltaCount = 0;

  for (const offer of offers) {
    const status = String(offer.status ?? "").toUpperCase();
    if (status === "DONE" || status === "VERIFIED") completedTasks += 1;
    if (status === "VERIFIED") verifiedTasks += 1;

    const createdAt = validDate(offer.createdAt);
    const respondedAt = validDate(offer.respondedAt);
    const completedAt = validDate(offer.completedAt);

    // Preserve the existing profile definition: assignment creation -> completion/arrival.
    if (createdAt && completedAt) {
      const diffMinutes = (completedAt.getTime() - createdAt.getTime()) / 60_000;
      if (diffMinutes >= 0) {
        responseDeltaSum += diffMinutes;
        responseDeltaCount += 1;
      }
    }

    if (!respondedAt || (status !== "DONE" && status !== "VERIFIED")) continue;

    const endAt = completedAt ?? validDate(offer.verifiedAt) ?? validDate(offer.updatedAt);
    if (!endAt) continue;

    totalVolunteerHours += Math.max(
      0,
      (endAt.getTime() - respondedAt.getTime()) / 3_600_000
    );
  }

  return {
    completedTasks,
    verifiedTasks,
    volunteerHours: roundToSingleDecimal(totalVolunteerHours),
    avgResponseTimeMinutes:
      responseDeltaCount > 0
        ? roundToSingleDecimal(responseDeltaSum / responseDeltaCount)
        : null,
  };
}

export async function getVolunteerServiceStats(
  volunteerId: Types.ObjectId
): Promise<VolunteerServiceStats> {
  const offers = await DispatchOffer.find({
    volunteerId,
    status: { $in: ["ACCEPTED", "DONE", "VERIFIED"] },
  })
    .select("status createdAt respondedAt completedAt verifiedAt updatedAt")
    .lean();

  return calculateVolunteerServiceStats(offers);
}
