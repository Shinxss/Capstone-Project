import { LEVEL_DEFINITIONS, XP_AWARDS } from "./achievement.constants";
import type {
  LevelDefinition,
  ProgressionXpSource,
  UserProgressionDto,
} from "./achievement.types";

function nonNegative(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function wholeCount(value: unknown) {
  return Math.floor(nonNegative(value));
}

export function calculateLifetimeXp(source: ProgressionXpSource): number {
  const xp =
    (source.profileComplete ? XP_AWARDS.completedProfile : 0) +
    (source.approvedVolunteer ? XP_AWARDS.approvedVolunteer : 0) +
    wholeCount(source.verifiedTasks) * XP_AWARDS.verifiedTask +
    nonNegative(source.verifiedVolunteerHours) * XP_AWARDS.verifiedServiceHour +
    wholeCount(source.approvedReports) * XP_AWARDS.approvedReport +
    wholeCount(source.permanentAchievements) * XP_AWARDS.permanentAchievement;

  return Math.max(0, Math.round(xp));
}

export function getLevelForXp(lifetimeXp: number): LevelDefinition {
  const safeXp = nonNegative(lifetimeXp);
  let current = LEVEL_DEFINITIONS[0];
  for (const definition of LEVEL_DEFINITIONS) {
    if (definition.requiredXp > safeXp) break;
    current = definition;
  }
  return current;
}

export function calculateLevelProgress(lifetimeXp: number): UserProgressionDto {
  const safeXp = Math.round(nonNegative(lifetimeXp));
  const current = getLevelForXp(safeXp);
  const next = LEVEL_DEFINITIONS.find(({ level }) => level === current.level + 1) ?? null;

  if (!next) {
    return {
      lifetimeXp: safeXp,
      currentLevel: current.level,
      currentLevelTitle: current.title,
      currentLevelStartXp: current.requiredXp,
      nextLevel: null,
      nextLevelTitle: null,
      nextLevelRequiredXp: null,
      xpIntoCurrentLevel: Math.max(0, safeXp - current.requiredXp),
      xpRequiredForNextLevel: 0,
      xpRemainingToNextLevel: 0,
      progressPercent: 100,
      maxLevel: true,
    };
  }

  const xpRequiredForNextLevel = next.requiredXp - current.requiredXp;
  const xpIntoCurrentLevel = Math.min(
    xpRequiredForNextLevel,
    Math.max(0, safeXp - current.requiredXp)
  );
  const progressPercent = xpRequiredForNextLevel > 0
    ? Math.min(100, Math.max(0, Math.round((xpIntoCurrentLevel / xpRequiredForNextLevel) * 100)))
    : 0;

  return {
    lifetimeXp: safeXp,
    currentLevel: current.level,
    currentLevelTitle: current.title,
    currentLevelStartXp: current.requiredXp,
    nextLevel: next.level,
    nextLevelTitle: next.title,
    nextLevelRequiredXp: next.requiredXp,
    xpIntoCurrentLevel,
    xpRequiredForNextLevel,
    xpRemainingToNextLevel: Math.max(0, xpRequiredForNextLevel - xpIntoCurrentLevel),
    progressPercent,
    maxLevel: false,
  };
}

export function buildUserProgression(source: ProgressionXpSource): UserProgressionDto {
  return calculateLevelProgress(calculateLifetimeXp(source));
}
