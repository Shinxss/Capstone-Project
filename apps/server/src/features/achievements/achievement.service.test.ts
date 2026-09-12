import assert from "node:assert/strict";
import test from "node:test";
import { calculateVolunteerServiceStats } from "../dispatches/dispatch.volunteerStats";
import { ACHIEVEMENT_DEFINITIONS } from "./achievement.constants";
import { UserAchievement } from "./achievement.model";
import { buildAchievementsResponse, getEligibleAchievementIds } from "./achievement.service";
import { ACHIEVEMENT_IDS, type AchievementMetrics } from "./achievement.types";

function metrics(overrides: Partial<AchievementMetrics> = {}): AchievementMetrics {
  return {
    role: "VOLUNTEER",
    volunteerStatus: "APPROVED",
    profileComplete: false,
    hasVolunteerSkills: false,
    respondedDispatchCount: 0,
    terminalRespondedAssignments: 0,
    successfulTerminalAssignments: 0,
    completionRate: 0,
    completedTasks: 0,
    verifiedTasks: 0,
    volunteerHours: 0,
    verifiedVolunteerHours: 0,
    reviewCount: 0,
    averageRating: 0,
    verifiedProofTaskCount: 0,
    blockchainVerifiedTaskCount: 0,
    teamVerifiedEmergencyCount: 0,
    distinctVerifiedBarangays: 0,
    distinctVerifiedEmergencyTypes: 0,
    verifiedByEmergencyType: {},
    isActiveTeamLeader: false,
    reportCount: 0,
    approvedReportCount: 0,
    distinctApprovedReportTypes: 0,
    ...overrides,
  };
}

test("all 50 definitions preserve the exact progression order", () => {
  assert.equal(ACHIEVEMENT_IDS.length, 50);
  assert.deepEqual(ACHIEVEMENT_DEFINITIONS.map(({ id }) => id), [...ACHIEVEMENT_IDS]);
  assert.deepEqual(ACHIEVEMENT_DEFINITIONS.map(({ sortOrder }) => sortOrder), Array.from({ length: 50 }, (_, index) => index + 1));
});

test("eligible response sets are 50 for volunteers, 6 for community, and empty for admin", () => {
  const volunteer = buildAchievementsResponse(metrics(), []);
  const community = buildAchievementsResponse(metrics({ role: "COMMUNITY" }), []);
  const admin = buildAchievementsResponse(metrics({ role: "ADMIN" }), []);

  assert.equal(volunteer.summary.total, 50);
  assert.equal(community.summary.total, 6);
  assert.deepEqual(community.achievements.map(({ id }) => id), ACHIEVEMENT_IDS.slice(39, 45));
  assert.equal(admin.summary.total, 0);
  assert.deepEqual(admin.achievements, []);
});

test("community users cannot qualify for volunteer badges from forged-looking metrics", () => {
  const forgedMetrics = metrics({
    role: "COMMUNITY",
    volunteerStatus: "APPROVED",
    respondedDispatchCount: 500,
    verifiedTasks: 500,
    volunteerHours: 1000,
    verifiedVolunteerHours: 1000,
    reviewCount: 50,
    averageRating: 5,
    approvedReportCount: 1,
  });
  const eligible = getEligibleAchievementIds(forgedMetrics);
  assert.equal(eligible.some((id) => ACHIEVEMENT_IDS.slice(0, 39).includes(id)), false);
  assert.equal(eligible.some((id) => ACHIEVEMENT_IDS.slice(45).includes(id)), false);
  assert.equal(buildAchievementsResponse(forgedMetrics, []).progression.lifetimeXp, 40);
});

test("progression response combines trusted metrics with permanent achievement records", () => {
  const unlockedAt = new Date("2026-08-14T08:30:00.000Z");
  const response = buildAchievementsResponse(metrics({
    volunteerStatus: "APPROVED",
    profileComplete: true,
    verifiedTasks: 2,
    verifiedVolunteerHours: 3.5,
    approvedReportCount: 1,
  }), [
    { achievementId: "verified-volunteer", unlockedAt },
    { achievementId: "community-ready", unlockedAt },
  ]);

  assert.equal(response.progression.lifetimeXp, 515);
  assert.equal(response.progression.currentLevel, 3);
  assert.equal(response.progression.currentLevelTitle, "Trusted Helper");
});

test("existing achievements 1-10 retain historical milestone behavior", () => {
  const eligible = getEligibleAchievementIds(metrics({ respondedDispatchCount: 1, verifiedTasks: 27 }));
  assert.deepEqual(eligible.slice(0, 6), [
    "verified-volunteer",
    "ready-to-respond",
    "first-response",
    "helping-hand",
    "community-responder",
    "dedicated-responder",
  ]);
});

test("historical task and service-hour milestones backfill without lowering thresholds", () => {
  const eligible = getEligibleAchievementIds(metrics({ verifiedTasks: 120, volunteerHours: 280 }));
  for (const expected of [
    "first-response",
    "helping-hand",
    "community-responder",
    "dedicated-responder",
    "lifeline-guardian",
    "community-protector",
    "making-a-difference",
    "service-starter",
    "community-supporter",
    "service-champion",
    "community-guardian",
    "lifeline-veteran",
  ] as const) {
    assert.equal(eligible.includes(expected), true, `${expected} should backfill`);
  }
  assert.equal(eligible.includes("response-veteran"), false);
  assert.equal(eligible.includes("legacy-responder"), false);
});

test("Dependable Hand requires ten terminal responses and 90 percent reliability", () => {
  assert.equal(getEligibleAchievementIds(metrics({ terminalRespondedAssignments: 10, successfulTerminalAssignments: 8, completionRate: 0.8 })).includes("dependable-hand"), false);
  assert.equal(getEligibleAchievementIds(metrics({ terminalRespondedAssignments: 9, successfulTerminalAssignments: 9, completionRate: 1 })).includes("dependable-hand"), false);
  assert.equal(getEligibleAchievementIds(metrics({ terminalRespondedAssignments: 10, successfulTerminalAssignments: 9, completionRate: 0.9 })).includes("dependable-hand"), true);

  const progress = buildAchievementsResponse(metrics({ terminalRespondedAssignments: 12, successfulTerminalAssignments: 10, completionRate: 10 / 12 }), []).achievements.find(({ id }) => id === "dependable-hand")?.progress;
  assert.equal(progress?.label, "83% / 90% completion rate");
});

test("Trusted tiers require both review count and rating", () => {
  assert.equal(getEligibleAchievementIds(metrics({ reviewCount: 20, averageRating: 4.6 })).includes("trusted-lifeline"), false);
  assert.equal(getEligibleAchievementIds(metrics({ reviewCount: 19, averageRating: 5 })).includes("trusted-lifeline"), false);
  assert.equal(getEligibleAchievementIds(metrics({ reviewCount: 20, averageRating: 4.7 })).includes("trusted-lifeline"), true);
});

test("permanent achievements remain unlocked after metrics later decrease", () => {
  const unlockedAt = new Date("2026-08-14T08:30:00.000Z");
  const response = buildAchievementsResponse(metrics({ completionRate: 0.2, reviewCount: 1, averageRating: 2 }), [
    { achievementId: "dependable-hand", unlockedAt },
    { achievementId: "trusted-lifeline", unlockedAt },
  ]);
  assert.equal(response.achievements.find(({ id }) => id === "dependable-hand")?.unlocked, true);
  assert.equal(response.achievements.find(({ id }) => id === "trusted-lifeline")?.unlocked, true);
});

test("team milestones use the one shared distinct collaborative-emergency count", () => {
  const eligible = getEligibleAchievementIds(metrics({ teamVerifiedEmergencyCount: 10 }));
  assert.equal(eligible.includes("team-player"), true);
  assert.equal(eligible.includes("helping-together"), true);
  assert.equal(eligible.includes("response-partner"), true);
  assert.equal(eligible.includes("united-we-respond"), false);
});

test("proof, blockchain, and canonical specialty metrics unlock their corresponding badges", () => {
  const eligible = getEligibleAchievementIds(metrics({
    verifiedProofTaskCount: 1,
    blockchainVerifiedTaskCount: 25,
    distinctVerifiedEmergencyTypes: 4,
    verifiedByEmergencyType: { MEDICAL: 1, FLOOD: 4, FIRE: 1, COLLAPSE: 1, TYPHOON: 1 },
  }));
  for (const expected of [
    "response-certified",
    "chain-of-trust",
    "immutable-impact",
    "medical-aid-responder",
    "flood-response-ready",
    "fire-response-ready",
    "rescue-ready",
    "evacuation-supporter",
    "field-support-specialist",
  ] as const) {
    assert.equal(eligible.includes(expected), true, `${expected} should unlock`);
  }
});

test("Relief Coordinator uses the documented leadership plus flood/typhoon fallback", () => {
  const base = { isActiveTeamLeader: true, verifiedByEmergencyType: { FLOOD: 6, TYPHOON: 4 } };
  assert.equal(getEligibleAchievementIds(metrics(base)).includes("relief-coordinator"), true);
  assert.equal(getEligibleAchievementIds(metrics({ ...base, isActiveTeamLeader: false })).includes("relief-coordinator"), false);
});

test("community reporting milestones count approved reports separately", () => {
  const eligible = getEligibleAchievementIds(metrics({ role: "COMMUNITY", reportCount: 8, approvedReportCount: 5, distinctApprovedReportTypes: 2 }));
  assert.equal(eligible.includes("safety-aware"), true);
  assert.equal(eligible.includes("verified-reporter"), true);
  assert.equal(eligible.includes("community-watch"), true);
  assert.equal(eligible.includes("prepared-citizen"), false);
});

test("multi-condition progress uses the least-complete requirement", () => {
  const progress = buildAchievementsResponse(metrics({ verifiedTasks: 150, volunteerHours: 400, reviewCount: 20, averageRating: 4.8 }), []).achievements.find(({ id }) => id === "beacon-of-hope")?.progress;
  assert.equal(progress?.percent, 75);
  assert.equal(progress?.label, "150 / 200 verified tasks");
});

test("profile and achievements can share the same volunteer-hour calculation", () => {
  const stats = calculateVolunteerServiceStats([
    { status: "VERIFIED", createdAt: new Date("2026-01-01T00:00:00Z"), respondedAt: new Date("2026-01-01T01:00:00Z"), completedAt: new Date("2026-01-01T04:30:00Z"), verifiedAt: new Date("2026-01-01T05:00:00Z"), updatedAt: new Date("2026-01-01T06:00:00Z") },
    { status: "DONE", createdAt: new Date("2026-01-02T00:00:00Z"), respondedAt: new Date("2026-01-02T01:00:00Z"), completedAt: new Date("2026-01-02T02:30:00Z"), updatedAt: new Date("2026-01-02T03:00:00Z") },
    { status: "DECLINED", respondedAt: new Date("2026-01-03T01:00:00Z"), updatedAt: new Date("2026-01-03T02:00:00Z") },
  ]);
  assert.deepEqual({ completedTasks: stats.completedTasks, verifiedTasks: stats.verifiedTasks, volunteerHours: stats.volunteerHours }, { completedTasks: 2, verifiedTasks: 1, volunteerHours: 5 });
  assert.equal(stats.verifiedVolunteerHours, 3.5);
});

test("the earned-achievement model keeps the unique user and achievement index", () => {
  const indexes = UserAchievement.schema.indexes() as Array<[Record<string, number>, { unique?: boolean }]>;
  const uniqueIndex = indexes.find(([fields]) => fields.userId === 1 && fields.achievementId === 1);
  assert.ok(uniqueIndex);
  assert.equal(uniqueIndex[1].unique, true);
});
