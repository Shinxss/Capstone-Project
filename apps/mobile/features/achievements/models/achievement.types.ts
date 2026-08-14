export const ACHIEVEMENT_IDS = [
  "verified-volunteer",
  "ready-to-respond",
  "first-response",
  "helping-hand",
  "community-responder",
  "dedicated-responder",
  "lifeline-guardian",
  "community-protector",
  "response-veteran",
  "trusted-responder",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
export type AchievementCategory = "verification" | "response" | "service" | "trust";
export type AchievementFilter = "all" | "unlocked" | "locked";

export type AchievementProgress = {
  current: number;
  target: number;
  percent: number;
  label: string;
};

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  category: AchievementCategory;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgress;
};

export type AchievementSummary = {
  unlocked: number;
  total: number;
  percent: number;
};

export type AchievementsResponse = {
  summary: AchievementSummary;
  achievements: Achievement[];
};
