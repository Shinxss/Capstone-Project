import assert from "node:assert/strict";
import test from "node:test";
import { evaluateVolunteerDutyEligibility } from "./volunteerDutyStatus";

test("active responder accounts may update duty status", () => {
  assert.deepEqual(
    evaluateVolunteerDutyEligibility({ role: "RESPONDER", isActive: true }),
    { allowed: true }
  );
});

test("approved active volunteers retain the existing heartbeat capability", () => {
  assert.deepEqual(
    evaluateVolunteerDutyEligibility({
      role: "VOLUNTEER",
      volunteerStatus: "APPROVED",
      isActive: true,
    }),
    { allowed: true }
  );
});

test("suspended responders cannot return on duty through an existing socket", () => {
  assert.deepEqual(
    evaluateVolunteerDutyEligibility({ role: "RESPONDER", isActive: false }),
    {
      allowed: false,
      message: "Your responder account is currently suspended.",
    }
  );
});

test("unapproved volunteers and unrelated roles cannot update responder availability", () => {
  assert.equal(
    evaluateVolunteerDutyEligibility({ role: "VOLUNTEER", volunteerStatus: "PENDING", isActive: true })
      .allowed,
    false
  );
  assert.equal(evaluateVolunteerDutyEligibility({ role: "COMMUNITY", isActive: true }).allowed, false);
});
