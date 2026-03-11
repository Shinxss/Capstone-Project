import { DAILY_FOCUS_GOALS } from "../constants/dispatchUi.constants";

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function asPositiveGoal(value: unknown, fallback: number) {
  const parsed = Math.round(asNumber(value, fallback));
  return parsed > 0 ? parsed : fallback;
}

export function computeFocusDonutPercent(input: {
  respondedCount: number;
  respondedGoal: number;
  volunteerHours: number;
  volunteerHoursGoal: number;
  completedCount: number;
  completedGoal: number;
}) {
  const respondedProgress = clamp(input.respondedCount / input.respondedGoal, 0, 1);
  const volunteerHoursProgress = clamp(input.volunteerHours / input.volunteerHoursGoal, 0, 1);
  const completedProgress = clamp(input.completedCount / input.completedGoal, 0, 1);
  return Math.round(((respondedProgress + volunteerHoursProgress + completedProgress) / 3) * 100);
}

export function createDispatchFocusStatsFallback(
  overrides: Partial<Omit<DispatchFocusStats, "range">> = {}
): DispatchFocusStats {
  const respondedGoal = asPositiveGoal(overrides.respondedGoal, DAILY_FOCUS_GOALS.respondedGoal);
  const volunteerHoursGoal = asPositiveGoal(
    overrides.volunteerHoursGoal,
    DAILY_FOCUS_GOALS.volunteerHoursGoal
  );
  const completedGoal = asPositiveGoal(overrides.completedGoal, DAILY_FOCUS_GOALS.completedGoal);
  const respondedCount = Math.max(0, asNumber(overrides.respondedCount, 0));
  const volunteerHours = Math.max(0, asNumber(overrides.volunteerHours, 0));
  const completedCount = Math.max(0, asNumber(overrides.completedCount, 0));

  const donutPercent = clamp(
    Math.round(
      asNumber(
        overrides.donutPercent,
        computeFocusDonutPercent({
          respondedCount,
          respondedGoal,
          volunteerHours,
          volunteerHoursGoal,
          completedCount,
          completedGoal,
        })
      )
    ),
    0,
    100
  );

  return {
    range: "today",
    respondedCount,
    respondedGoal,
    volunteerHours,
    volunteerHoursGoal,
    completedCount,
    completedGoal,
    donutPercent,
  };
}

export function normalizeDispatchFocusStats(raw: unknown): DispatchFocusStats {
  const record = (raw ?? {}) as Record<string, unknown>;
  const parsedDonutPercent =
    typeof record.donutPercent === "number" && Number.isFinite(record.donutPercent)
      ? record.donutPercent
      : undefined;

  return createDispatchFocusStatsFallback({
    respondedCount: asNumber(record.respondedCount, 0),
    respondedGoal: asNumber(record.respondedGoal, DAILY_FOCUS_GOALS.respondedGoal),
    volunteerHours: asNumber(record.volunteerHours, 0),
    volunteerHoursGoal: asNumber(record.volunteerHoursGoal, DAILY_FOCUS_GOALS.volunteerHoursGoal),
    completedCount: asNumber(record.completedCount, 0),
    completedGoal: asNumber(record.completedGoal, DAILY_FOCUS_GOALS.completedGoal),
    donutPercent: parsedDonutPercent,
  });
}
