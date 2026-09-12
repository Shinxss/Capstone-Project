import type { LevelDefinition } from "../models/achievement.types";

export const LEVEL_DEFINITIONS: readonly LevelDefinition[] = [
  { level: 1, title: "First Step", requiredXp: 0 },
  { level: 2, title: "Community Helper", requiredXp: 150 },
  { level: 3, title: "Trusted Helper", requiredXp: 400 },
  { level: 4, title: "Prepared Responder", requiredXp: 800 },
  { level: 5, title: "Active Responder", requiredXp: 1_400 },
  { level: 6, title: "Community Champion", requiredXp: 2_200 },
  { level: 7, title: "Lifesaver", requiredXp: 3_200 },
  { level: 8, title: "Rapid Responder", requiredXp: 4_500 },
  { level: 9, title: "Community Guardian", requiredXp: 6_200 },
  { level: 10, title: "Lifeline Hero", requiredXp: 8_500 },
] as const;
