import { UserIdCounter } from "./userIdCounter.model";

export const LIFELINE_ID_PREFIX = "LF";
export const LIFELINE_USER_ID_SCOPE = "lifeline-user-id";
export const LIFELINE_ID_REGEX = /^LF-\d{4}-\d{6}$/;

export function normalizeLifelineId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return normalized || undefined;
}

export function formatLifelineId(year: number, seq: number): string {
  return `${LIFELINE_ID_PREFIX}-${year}-${String(seq).padStart(6, "0")}`;
}

function resolveYear(date?: Date): number {
  if (date instanceof Date && Number.isFinite(date.getTime())) {
    return date.getFullYear();
  }
  return new Date().getFullYear();
}

async function incrementYearlySequence(year: number): Promise<number> {
  // Never derive IDs from countDocuments()/last record, which is race-prone under concurrency.
  const counter = await UserIdCounter.findOneAndUpdate(
    { scope: LIFELINE_USER_ID_SCOPE, year },
    {
      $setOnInsert: { scope: LIFELINE_USER_ID_SCOPE, year },
      $inc: { seq: 1 },
    },
    { upsert: true, new: true }
  ).lean();

  const seq = Number(counter?.seq ?? 0);
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error(`Failed to increment Lifeline ID counter for year ${year}.`);
  }

  return seq;
}

export async function generateNextLifelineId(date?: Date): Promise<string> {
  const year = resolveYear(date);
  const seq = await incrementYearlySequence(year);
  return formatLifelineId(year, seq);
}
