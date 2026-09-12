import { api } from "../../../lib/api";
import {
  ACHIEVEMENT_IDS,
  COMMUNITY_ACHIEVEMENT_IDS,
  type Achievement,
  type AchievementCategory,
  type AchievementId,
  type AchievementsResponse,
  type LevelNumber,
  type UserProgression,
} from "../models/achievement.types";
import { LEVEL_DEFINITIONS } from "../constants/levelUi.constants";

const ACHIEVEMENT_ID_SET = new Set<string>(ACHIEVEMENT_IDS);
const COMMUNITY_ID_SET = new Set<string>(COMMUNITY_ACHIEVEMENT_IDS);
const ACHIEVEMENT_CATEGORIES = new Set<AchievementCategory>([
  "verification",
  "response",
  "service",
  "trust",
  "blockchain",
  "teamwork",
  "specialty",
  "community",
  "recognition",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function asNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function asLevelNumber(value: unknown): LevelNumber | null {
  const parsed = asNonNegativeInteger(value);
  return parsed !== null && parsed >= 1 && parsed <= 10 ? (parsed as LevelNumber) : null;
}

function asAchievementId(value: unknown): AchievementId | null {
  const id = String(value ?? "");
  return ACHIEVEMENT_ID_SET.has(id) ? (id as AchievementId) : null;
}

function normalizeAchievement(value: unknown): Achievement {
  if (!isRecord(value) || !isRecord(value.progress)) {
    throw new Error("Malformed achievement entry");
  }

  const id = asAchievementId(value.id);
  const category = String(value.category ?? "") as AchievementCategory;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const sortOrder = asFiniteNumber(value.sortOrder);
  const current = asFiniteNumber(value.progress.current);
  const target = asFiniteNumber(value.progress.target);
  const percent = asFiniteNumber(value.progress.percent);
  const label = typeof value.progress.label === "string" ? value.progress.label.trim() : "";

  if (
    !id ||
    !ACHIEVEMENT_CATEGORIES.has(category) ||
    !title ||
    !description ||
    sortOrder === null ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 1 ||
    current === null ||
    current < 0 ||
    target === null ||
    target < 0 ||
    percent === null ||
    percent < 0 ||
    percent > 100 ||
    !label
  ) {
    throw new Error("Malformed achievement definition");
  }

  if (typeof value.unlocked !== "boolean") throw new Error("Malformed achievement status");
  const unlocked = value.unlocked;
  const unlockedAtValue = typeof value.unlockedAt === "string" ? value.unlockedAt : null;
  const unlockedAt = unlockedAtValue && Number.isFinite(new Date(unlockedAtValue).getTime())
    ? unlockedAtValue
    : null;
  if (unlocked && !unlockedAt) throw new Error("Unlocked achievement is missing its timestamp");
  if (!unlocked && unlockedAt) throw new Error("Locked achievement has an unlock timestamp");

  return {
    id,
    title,
    description,
    category,
    sortOrder: Math.round(sortOrder),
    unlocked,
    unlockedAt,
    progress: {
      current,
      target,
      percent: clampPercent(percent),
      label,
    },
  };
}

function isExactIdSet(achievements: readonly Achievement[], expected: ReadonlySet<string>) {
  return achievements.length === expected.size && achievements.every(({ id }) => expected.has(id));
}

function normalizeProgression(value: unknown): UserProgression {
  if (!isRecord(value)) throw new Error("Invalid achievement progression");

  const lifetimeXp = asNonNegativeInteger(value.lifetimeXp);
  const currentLevel = asLevelNumber(value.currentLevel);
  const currentLevelStartXp = asNonNegativeInteger(value.currentLevelStartXp);
  const nextLevel = value.nextLevel === null ? null : asLevelNumber(value.nextLevel);
  const nextLevelRequiredXp = value.nextLevelRequiredXp === null
    ? null
    : asNonNegativeInteger(value.nextLevelRequiredXp);
  const xpIntoCurrentLevel = asNonNegativeInteger(value.xpIntoCurrentLevel);
  const xpRequiredForNextLevel = asNonNegativeInteger(value.xpRequiredForNextLevel);
  const xpRemainingToNextLevel = asNonNegativeInteger(value.xpRemainingToNextLevel);
  const progressPercent = asNonNegativeInteger(value.progressPercent);
  const currentLevelTitle = typeof value.currentLevelTitle === "string"
    ? value.currentLevelTitle.trim()
    : "";
  const nextLevelTitle = value.nextLevelTitle === null
    ? null
    : typeof value.nextLevelTitle === "string"
      ? value.nextLevelTitle.trim()
      : "";

  if (
    lifetimeXp === null ||
    currentLevel === null ||
    currentLevelStartXp === null ||
    xpIntoCurrentLevel === null ||
    xpRequiredForNextLevel === null ||
    xpRemainingToNextLevel === null ||
    progressPercent === null ||
    progressPercent > 100 ||
    typeof value.maxLevel !== "boolean"
  ) {
    throw new Error("Malformed achievement progression values");
  }

  const expectedCurrent = [...LEVEL_DEFINITIONS]
    .reverse()
    .find(({ requiredXp }) => requiredXp <= lifetimeXp) ?? LEVEL_DEFINITIONS[0];
  if (
    currentLevel !== expectedCurrent.level ||
    currentLevelTitle !== expectedCurrent.title ||
    currentLevelStartXp !== expectedCurrent.requiredXp
  ) {
    throw new Error("Inconsistent current achievement level");
  }

  const expectedNext = LEVEL_DEFINITIONS.find(({ level }) => level === currentLevel + 1) ?? null;
  if (!expectedNext) {
    if (
      !value.maxLevel ||
      nextLevel !== null ||
      nextLevelTitle !== null ||
      nextLevelRequiredXp !== null ||
      xpIntoCurrentLevel !== lifetimeXp - currentLevelStartXp ||
      xpRequiredForNextLevel !== 0 ||
      xpRemainingToNextLevel !== 0 ||
      progressPercent !== 100
    ) {
      throw new Error("Inconsistent maximum achievement level");
    }
  } else {
    const expectedRequired = expectedNext.requiredXp - currentLevelStartXp;
    const expectedInto = lifetimeXp - currentLevelStartXp;
    const expectedRemaining = expectedNext.requiredXp - lifetimeXp;
    const expectedPercent = clampPercent((expectedInto / expectedRequired) * 100);
    if (
      value.maxLevel ||
      nextLevel !== expectedNext.level ||
      nextLevelTitle !== expectedNext.title ||
      nextLevelRequiredXp !== expectedNext.requiredXp ||
      xpIntoCurrentLevel !== expectedInto ||
      xpRequiredForNextLevel !== expectedRequired ||
      xpRemainingToNextLevel !== expectedRemaining ||
      progressPercent !== expectedPercent
    ) {
      throw new Error("Inconsistent next achievement level");
    }
  }

  return {
    lifetimeXp,
    currentLevel,
    currentLevelTitle,
    currentLevelStartXp,
    nextLevel,
    nextLevelTitle,
    nextLevelRequiredXp,
    xpIntoCurrentLevel,
    xpRequiredForNextLevel,
    xpRemainingToNextLevel,
    progressPercent,
    maxLevel: value.maxLevel,
  };
}

function normalizeAchievementsResponse(payload: unknown): AchievementsResponse {
  if (
    !isRecord(payload) ||
    !isRecord(payload.summary) ||
    !isRecord(payload.progression) ||
    !Array.isArray(payload.achievements)
  ) {
    throw new Error("Invalid achievements response");
  }

  const achievements = payload.achievements.map(normalizeAchievement);
  const progression = normalizeProgression(payload.progression);
  const ids = new Set(achievements.map(({ id }) => id));
  const sortOrders = new Set(achievements.map(({ sortOrder }) => sortOrder));
  if (ids.size !== achievements.length || sortOrders.size !== achievements.length) {
    throw new Error("Duplicate achievement response entry");
  }

  const validAudienceSet =
    achievements.length === 0 ||
    isExactIdSet(achievements, COMMUNITY_ID_SET) ||
    isExactIdSet(achievements, ACHIEVEMENT_ID_SET);
  if (!validAudienceSet) throw new Error("Unexpected achievement audience response");

  achievements.sort((a, b) => a.sortOrder - b.sortOrder);
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const total = achievements.length;
  const percent = total > 0 ? clampPercent((unlocked / total) * 100) : 0;

  const responseUnlocked = asFiniteNumber(payload.summary.unlocked);
  const responseTotal = asFiniteNumber(payload.summary.total);
  const responsePercent = asFiniteNumber(payload.summary.percent);
  if (
    responseUnlocked !== unlocked ||
    responseTotal !== total ||
    responsePercent === null ||
    clampPercent(responsePercent) !== percent
  ) {
    throw new Error("Inconsistent achievement summary");
  }

  return { summary: { unlocked, total, percent }, progression, achievements };
}

export async function getMyAchievements(): Promise<AchievementsResponse> {
  const response = await api.get<unknown>("/api/achievements/me");
  return normalizeAchievementsResponse(response.data);
}
