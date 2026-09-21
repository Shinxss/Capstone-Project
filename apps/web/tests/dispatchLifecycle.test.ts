import assert from "node:assert/strict";
import test from "node:test";
import type { DispatchTask, DispatchTaskStatus } from "../src/features/tasks/models/tasks.types";
import {
  blockingResponderIds,
  getResponderDispatchState,
  nextPendingOfferExpirationMs,
  responderDispatchStates,
} from "../src/features/lguLiveMap/dispatch/utils/dispatchLifecycle.utils";

const nowMs = Date.parse("2026-09-21T12:00:00.000Z");

function task(status: DispatchTaskStatus, expiresAt?: string): DispatchTask {
  return {
    id: `${status}-${expiresAt ?? "none"}`,
    status,
    expiresAt,
    volunteer: { id: "responder-a", name: "Responder A" },
    emergency: {
      id: "emergency-a",
      emergencyType: "FIRE",
      source: "REPORT",
      status: "ACKNOWLEDGED",
      lng: 120.3,
      lat: 16,
    },
  };
}

test("valid pending is awaiting response and expired pending is selectable", () => {
  const active = task("PENDING", new Date(nowMs + 1_000).toISOString());
  const expired = task("PENDING", new Date(nowMs).toISOString());

  assert.equal(getResponderDispatchState(active, nowMs), "awaiting_response");
  assert.equal(getResponderDispatchState(expired, nowMs), "available");
  assert.equal(blockingResponderIds([active], nowMs).has("responder-a"), true);
  assert.equal(blockingResponderIds([expired], nowMs).has("responder-a"), false);
});

test("accepted and done are assigned while declined, cancelled, and verified are selectable", () => {
  assert.equal(getResponderDispatchState(task("ACCEPTED"), nowMs), "assigned");
  assert.equal(getResponderDispatchState(task("DONE"), nowMs), "assigned");
  assert.equal(getResponderDispatchState(task("DECLINED"), nowMs), "available");
  assert.equal(getResponderDispatchState(task("CANCELLED"), nowMs), "available");
  assert.equal(getResponderDispatchState(task("VERIFIED"), nowMs), "available");
});

test("assigned state wins over pending history and the next expiration is scheduled", () => {
  const firstExpiry = nowMs + 1_000;
  const secondExpiry = nowMs + 5_000;
  const tasks = [
    task("PENDING", new Date(secondExpiry).toISOString()),
    task("ACCEPTED"),
    task("PENDING", new Date(firstExpiry).toISOString()),
  ];

  assert.equal(responderDispatchStates(tasks, nowMs).get("responder-a"), "assigned");
  assert.equal(nextPendingOfferExpirationMs(tasks, nowMs), firstExpiry);
});
