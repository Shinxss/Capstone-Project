import { api } from "../../../lib/api";
import {
  ACHIEVEMENT_IDS,
  type Achievement,
  type AchievementCategory,
  type AchievementId,
  type AchievementsResponse,
} from "../models/achievement.types";

const ACHIEVEMENT_ID_SET = new Set<string>(ACHIEVEMENT_IDS);
const ACHIEVEMENT_CATEGORIES = new Set<AchievementCategory>([
  "verification",
  "response",
  "service",
  "trust",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value: unknown) {
  return Math.min(100, Math.max(0, Math.round(asFiniteNumber(value))));
}

function asAchievementId(value: unknown): AchievementId | null {
  const id = String(value ?? "");
  return ACHIEVEMENT_ID_SET.has(id) ? (id as AchievementId) : null;
}

function asCategory(value: unknown): AchievementCategory {
  const category = String(value ?? "") as AchievementCategory;
  return ACHIEVEMENT_CATEGORIES.has(category) ? category : "service";
}

function normalizeAchievement(value: unknown): Achievement | null {
  if (!isRecord(value)) return null;
  const id = asAchievementId(value.id);
  if (!id || !isRecord(value.progress)) return null;

  const unlockedAtValue = typeof value.unlockedAt === "string" ? value.unlockedAt : null;
  const unlockedAt =
    unlockedAtValue && Number.isFinite(new Date(unlockedAtValue).getTime())
      ? unlockedAtValue
      : null;

  return {
    id,
    title: String(value.title ?? "Achievement").trim() || "Achievement",
    description: String(value.description ?? "").trim(),
    category: asCategory(value.category),
    sortOrder: Math.max(0, Math.round(asFiniteNumber(value.sortOrder))),
    unlocked: value.unlocked === true,
    unlockedAt,
    progress: {
      current: Math.max(0, asFiniteNumber(value.progress.current)),
      target: Math.max(0, asFiniteNumber(value.progress.target)),
      percent: clampPercent(value.progress.percent),
      label: String(value.progress.label ?? "").trim(),
    },
  };
}

function normalizeAchievementsResponse(payload: unknown): AchievementsResponse {
  if (!isRecord(payload) || !Array.isArray(payload.achievements)) {
    throw new Error("Invalid achievements response");
  }

  const achievements = payload.achievements
    .map(normalizeAchievement)
    .filter((achievement): achievement is Achievement => achievement !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (achievements.length !== ACHIEVEMENT_IDS.length) {
    throw new Error("Incomplete achievements response");
  }

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

export async function getMyAchievements(): Promise<AchievementsResponse> {
  const response = await api.get<unknown>("/api/achievements/me");
  return normalizeAchievementsResponse(response.data);
}
