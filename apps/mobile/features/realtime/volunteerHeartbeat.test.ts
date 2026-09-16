import assert from "node:assert/strict";
import test from "node:test";
import {
  getVolunteerHeartbeatPlan,
  VOLUNTEER_HEARTBEAT_INTERVAL_MS,
} from "./volunteerHeartbeat";

test("on-duty responders send immediately and continue every 15 seconds", () => {
  assert.deepEqual(getVolunteerHeartbeatPlan("RESPONDER", true), {
    enabled: true,
    onDuty: true,
    intervalMs: VOLUNTEER_HEARTBEAT_INTERVAL_MS,
  });
});

test("off-duty responders send false once without starting a repeating timer", () => {
  assert.deepEqual(getVolunteerHeartbeatPlan("RESPONDER", false), {
    enabled: true,
    onDuty: false,
    intervalMs: null,
  });
});

test("missing duty state is conservative and never forces a responder on duty", () => {
  assert.deepEqual(getVolunteerHeartbeatPlan("RESPONDER", undefined), {
    enabled: true,
    onDuty: false,
    intervalMs: null,
  });
});

test("community and LGU accounts do not send volunteer heartbeats", () => {
  assert.equal(getVolunteerHeartbeatPlan("COMMUNITY", true).enabled, false);
  assert.equal(getVolunteerHeartbeatPlan("LGU", true).enabled, false);
});
