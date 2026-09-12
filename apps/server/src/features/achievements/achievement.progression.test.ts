import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUserProgression,
  calculateLevelProgress,
  calculateLifetimeXp,
  getLevelForXp,
} from "./achievement.progression";
import type { ProgressionXpSource } from "./achievement.types";

const EMPTY_SOURCE: ProgressionXpSource = {
  profileComplete: false,
  approvedVolunteer: false,
  verifiedTasks: 0,
  verifiedVolunteerHours: 0,
  approvedReports: 0,
  permanentAchievements: 0,
};

test("level thresholds use the highest reached lifetime-XP boundary", () => {
  const cases = [
    [0, 1],
    [149, 1],
    [150, 2],
    [399, 2],
    [400, 3],
    [799, 3],
    [800, 4],
    [8_499, 9],
    [8_500, 10],
    [99_999, 10],
  ] as const;

  for (const [xp, level] of cases) assert.equal(getLevelForXp(xp).level, level);
});

test("negative and invalid XP safely fall back to Level 1", () => {
  assert.equal(calculateLevelProgress(-500).currentLevel, 1);
  assert.equal(calculateLevelProgress(Number.NaN).lifetimeXp, 0);
});

test("Level 10 is capped while lifetime XP keeps increasing", () => {
  assert.deepEqual(calculateLevelProgress(12_000), {
    lifetimeXp: 12_000,
    currentLevel: 10,
    currentLevelTitle: "Lifeline Hero",
    currentLevelStartXp: 8_500,
    nextLevel: null,
    nextLevelTitle: null,
    nextLevelRequiredXp: null,
    xpIntoCurrentLevel: 3_500,
    xpRequiredForNextLevel: 0,
    xpRemainingToNextLevel: 0,
    progressPercent: 100,
    maxLevel: true,
  });
});

test("progress is calculated within the current level range", () => {
  assert.deepEqual(calculateLevelProgress(950), {
    lifetimeXp: 950,
    currentLevel: 4,
    currentLevelTitle: "Prepared Responder",
    currentLevelStartXp: 800,
    nextLevel: 5,
    nextLevelTitle: "Active Responder",
    nextLevelRequiredXp: 1_400,
    xpIntoCurrentLevel: 150,
    xpRequiredForNextLevel: 600,
    xpRemainingToNextLevel: 450,
    progressPercent: 25,
    maxLevel: false,
  });
});

test("profile and volunteer approval awards are one-time boolean contributions", () => {
  assert.equal(calculateLifetimeXp({ ...EMPTY_SOURCE, profileComplete: true }), 50);
  assert.equal(calculateLifetimeXp({ ...EMPTY_SOURCE, approvedVolunteer: true }), 100);
  assert.equal(
    calculateLifetimeXp({ ...EMPTY_SOURCE, profileComplete: true, approvedVolunteer: true }),
    150
  );
});

test("verified tasks and verified service hours award their configured XP", () => {
  assert.equal(calculateLifetimeXp({ ...EMPTY_SOURCE, verifiedTasks: 3 }), 360);
  assert.equal(calculateLifetimeXp({ ...EMPTY_SOURCE, verifiedVolunteerHours: 4.5 }), 45);
});

test("approved reports and permanent achievements award deterministic XP", () => {
  assert.equal(calculateLifetimeXp({ ...EMPTY_SOURCE, approvedReports: 3 }), 120);
  assert.equal(calculateLifetimeXp({ ...EMPTY_SOURCE, permanentAchievements: 4 }), 100);
});

test("negative source metrics cannot reduce or create XP", () => {
  assert.equal(calculateLifetimeXp({
    ...EMPTY_SOURCE,
    verifiedTasks: -2,
    verifiedVolunteerHours: -5,
    approvedReports: -3,
    permanentAchievements: -1,
  }), 0);
});

test("repeated progression evaluation is idempotent", () => {
  const source: ProgressionXpSource = {
    profileComplete: true,
    approvedVolunteer: true,
    verifiedTasks: 7,
    verifiedVolunteerHours: 12.5,
    approvedReports: 4,
    permanentAchievements: 6,
  };
  assert.deepEqual(buildUserProgression(source), buildUserProgression(source));
  assert.equal(buildUserProgression(source).lifetimeXp, 1_425);
});
