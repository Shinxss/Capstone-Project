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

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export type AchievementAudience = "VOLUNTEER" | "COMMUNITY";

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

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  category: AchievementCategory;
  sortOrder: number;
  audiences: readonly AchievementAudience[];
};

export type AchievementAwardMetadata = {
  verifiedTasks?: number;
  reviewCount?: number;
  averageRating?: number;
};

export type AchievementMetrics = {
  role: string;
  volunteerStatus: string;
  profileComplete: boolean;
  hasVolunteerSkills: boolean;
  respondedDispatchCount: number;
  terminalRespondedAssignments: number;
  successfulTerminalAssignments: number;
  completionRate: number;
  completedTasks: number;
  verifiedTasks: number;
  volunteerHours: number;
  reviewCount: number;
  averageRating: number;
  verifiedProofTaskCount: number;
  blockchainVerifiedTaskCount: number;
  teamVerifiedEmergencyCount: number;
  distinctVerifiedBarangays: number;
  distinctVerifiedEmergencyTypes: number;
  verifiedByEmergencyType: Readonly<Record<string, number>>;
  isActiveTeamLeader: boolean;
  reportCount: number;
  approvedReportCount: number;
  distinctApprovedReportTypes: number;
};

// Backward-compatible alias for the original 1-10 unit-test/public helper surface.
export type AchievementEvaluationStats = AchievementMetrics;

export type AchievementProgressDto = {
  current: number;
  target: number;
  percent: number;
  label: string;
};

export type AchievementDto = Omit<AchievementDefinition, "audiences"> & {
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
