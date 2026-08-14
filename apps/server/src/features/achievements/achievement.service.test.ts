import assert from "node:assert/strict";
import test from "node:test";
import { ACHIEVEMENT_DEFINITIONS } from "./achievement.constants";
import { UserAchievement } from "./achievement.model";
import {
  buildAchievementsResponse,
  getEligibleAchievementIds,
} from "./achievement.service";
import type { AchievementEvaluationStats } from "./achievement.types";

function volunteerStats(
  overrides: Partial<AchievementEvaluationStats> = {}
): AchievementEvaluationStats {
  return {
    role: "VOLUNTEER",
    volunteerStatus: "APPROVED",
    respondedAssignments: 0,
    verifiedTasks: 0,
    reviewCount: 0,
    averageRating: 0,
    ...overrides,
  };
}

test("achievement definitions preserve the required progression order", () => {
  assert.deepEqual(
    ACHIEVEMENT_DEFINITIONS.map((definition) => definition.id),
    [
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
    ]
  );
});

test("non-volunteer roles cannot become eligible from forged-looking statistics", () => {
  const eligible = getEligibleAchievementIds(
    volunteerStats({
      role: "COMMUNITY",
      respondedAssignments: 10,
      verifiedTasks: 500,
      reviewCount: 20,
      averageRating: 5,
    })
  );

  assert.deepEqual(eligible, []);
});

test("historical verified tasks backfill every reached milestone", () => {
  const eligible = getEligibleAchievementIds(
    volunteerStats({ respondedAssignments: 1, verifiedTasks: 27 })
  );

  assert.deepEqual(eligible, [
    "verified-volunteer",
    "ready-to-respond",
    "first-response",
    "helping-hand",
    "community-responder",
    "dedicated-responder",
  ]);
});

test("Trusted Responder requires both review count and average rating", () => {
  assert.equal(
    getEligibleAchievementIds(volunteerStats({ reviewCount: 4, averageRating: 5 })).includes(
      "trusted-responder"
    ),
    false
  );
  assert.equal(
    getEligibleAchievementIds(volunteerStats({ reviewCount: 5, averageRating: 4.4 })).includes(
      "trusted-responder"
    ),
    false
  );
  assert.equal(
    getEligibleAchievementIds(volunteerStats({ reviewCount: 5, averageRating: 4.5 })).includes(
      "trusted-responder"
    ),
    true
  );
});

test("an earned Trusted Responder remains unlocked after rating drops", () => {
  const response = buildAchievementsResponse(
    volunteerStats({ reviewCount: 8, averageRating: 3.8 }),
    [
      {
        achievementId: "trusted-responder",
        unlockedAt: new Date("2026-08-14T08:30:00.000Z"),
      },
    ]
  );
  const trusted = response.achievements.find(
    (achievement) => achievement.id === "trusted-responder"
  );

  assert.equal(trusted?.unlocked, true);
  assert.equal(trusted?.progress.percent, 100);
  assert.equal(trusted?.unlockedAt, "2026-08-14T08:30:00.000Z");
});

test("Trusted Responder progress reports the unmet requirement", () => {
  const reviewsMissing = buildAchievementsResponse(
    volunteerStats({ reviewCount: 3, averageRating: 5 }),
    []
  ).achievements.find((achievement) => achievement.id === "trusted-responder");
  const ratingMissing = buildAchievementsResponse(
    volunteerStats({ reviewCount: 5, averageRating: 4.2 }),
    []
  ).achievements.find((achievement) => achievement.id === "trusted-responder");

  assert.equal(reviewsMissing?.progress.label, "3 / 5 reviews");
  assert.equal(ratingMissing?.progress.label, "4.2 / 4.5 average rating");
});

test("the earned-achievement model enforces one record per user and achievement", () => {
  const indexes = UserAchievement.schema.indexes() as Array<[
    Record<string, number>,
    { unique?: boolean },
  ]>;
  const uniqueIndex = indexes.find(([fields]) => {
    return fields.userId === 1 && fields.achievementId === 1;
  });

  assert.ok(uniqueIndex);
  assert.equal(uniqueIndex[1].unique, true);
});
