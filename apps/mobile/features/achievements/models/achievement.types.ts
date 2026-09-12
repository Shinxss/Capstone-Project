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
  "dependable-hand",
  "always-ready",
  "trusted-lifeline",
  "response-certified",
  "chain-of-trust",
  "immutable-impact",
  "team-player",
  "helping-together",
  "community-connector",
  "response-partner",
  "united-we-respond",
  "response-leader",
  "first-step",
  "getting-started",
  "making-a-difference",
  "service-starter",
  "community-supporter",
  "service-champion",
  "community-guardian",
  "lifeline-veteran",
  "legacy-responder",
  "medical-aid-responder",
  "flood-response-ready",
  "fire-response-ready",
  "rescue-ready",
  "evacuation-supporter",
  "relief-coordinator",
  "navigation-specialist",
  "field-support-specialist",
  "community-ready",
  "safety-aware",
  "verified-reporter",
  "community-watch",
  "prepared-citizen",
  "lifeline-supporter",
  "heart-of-lifeline",
  "guardian-of-the-community",
  "beacon-of-hope",
  "above-and-beyond",
  "pillar-of-service",
] as const;

export const COMMUNITY_ACHIEVEMENT_IDS = ACHIEVEMENT_IDS.slice(39, 45) as readonly AchievementId[];

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
export type AchievementCategory =
  | "verification"
  | "response"
  | "service"
  | "trust"
  | "blockchain"
  | "teamwork"
  | "specialty"
  | "community"
  | "recognition";
export type AchievementFilter = "all" | "unlocked" | "locked";
export type LevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type LevelDefinition = {
  level: LevelNumber;
  title: string;
  requiredXp: number;
};

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

export type UserProgression = {
  lifetimeXp: number;
  currentLevel: LevelNumber;
  currentLevelTitle: string;
  currentLevelStartXp: number;
  nextLevel: LevelNumber | null;
  nextLevelTitle: string | null;
  nextLevelRequiredXp: number | null;
  xpIntoCurrentLevel: number;
  xpRequiredForNextLevel: number;
  xpRemainingToNextLevel: number;
  progressPercent: number;
  maxLevel: boolean;
};

export type AchievementsResponse = {
  summary: AchievementSummary;
  progression: UserProgression;
  achievements: Achievement[];
};
