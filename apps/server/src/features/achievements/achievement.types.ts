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

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  category: AchievementCategory;
  sortOrder: number;
};

export type AchievementAwardMetadata = {
  verifiedTasks?: number;
  reviewCount?: number;
  averageRating?: number;
};

export type AchievementEvaluationStats = {
  role: string;
  volunteerStatus: string;
  respondedAssignments: number;
  verifiedTasks: number;
  reviewCount: number;
  averageRating: number;
};

export type AchievementProgressDto = {
  current: number;
  target: number;
  percent: number;
  label: string;
};

export type AchievementDto = AchievementDefinition & {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgressDto;
};

export type AchievementsResponseDto = {
  summary: {
    unlocked: number;
    total: number;
    percent: number;
  };
  achievements: AchievementDto[];
};
