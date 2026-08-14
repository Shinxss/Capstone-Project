import { z } from "zod";
import { ACHIEVEMENT_IDS, type AchievementId } from "./achievement.types";

export const achievementIdSchema = z.enum(ACHIEVEMENT_IDS);

export function isAchievementId(value: unknown): value is AchievementId {
  return achievementIdSchema.safeParse(value).success;
}
