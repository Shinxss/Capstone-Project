import type { AchievementDefinition, AchievementId } from "./achievement.types";

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: "verified-volunteer",
    title: "Verified Volunteer",
    description: "Become an officially verified Lifeline volunteer.",
    category: "verification",
    sortOrder: 1,
  },
  {
    id: "ready-to-respond",
    title: "Ready to Respond",
    description: "Respond to your first Lifeline emergency assignment.",
    category: "response",
    sortOrder: 2,
  },
  {
    id: "first-response",
    title: "First Response",
    description: "Complete your first officially verified emergency response.",
    category: "response",
    sortOrder: 3,
  },
  {
    id: "helping-hand",
    title: "Helping Hand",
    description: "Complete 5 verified emergency response tasks.",
    category: "service",
    sortOrder: 4,
  },
  {
    id: "community-responder",
    title: "Community Responder",
    description: "Complete 10 verified emergency response tasks.",
    category: "service",
    sortOrder: 5,
  },
  {
    id: "dedicated-responder",
    title: "Dedicated Responder",
    description: "Complete 25 verified emergency response tasks.",
    category: "service",
    sortOrder: 6,
  },
  {
    id: "lifeline-guardian",
    title: "Lifeline Guardian",
    description: "Complete 50 verified emergency response tasks.",
    category: "service",
    sortOrder: 7,
  },
  {
    id: "community-protector",
    title: "Community Protector",
    description: "Complete 100 verified emergency response tasks.",
    category: "service",
    sortOrder: 8,
  },
  {
    id: "response-veteran",
    title: "Response Veteran",
    description: "Complete 200 verified emergency response tasks.",
    category: "service",
    sortOrder: 9,
  },
  {
    id: "trusted-responder",
    title: "Trusted Responder",
    description: "Maintain an average rating of 4.5 or higher after receiving at least 5 community reviews.",
    category: "trust",
    sortOrder: 10,
  },
] as const;

export const VERIFIED_TASK_TARGETS: Readonly<Partial<Record<AchievementId, number>>> = {
  "first-response": 1,
  "helping-hand": 5,
  "community-responder": 10,
  "dedicated-responder": 25,
  "lifeline-guardian": 50,
  "community-protector": 100,
  "response-veteran": 200,
};

export const TRUSTED_RESPONDER_REVIEW_TARGET = 5;
export const TRUSTED_RESPONDER_RATING_TARGET = 4.5;
