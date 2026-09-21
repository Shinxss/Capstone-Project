import assert from "node:assert/strict";
import test from "node:test";
import type { DispatchOffer } from "../models/dispatch";
import { isPendingDispatchActive, pendingDispatchExpirationMs } from "./dispatchLifecycle";

const nowMs = Date.parse("2026-09-21T12:00:00.000Z");

function pending(expiresAt: string): DispatchOffer {
  return {
    id: "dispatch-a",
    status: "PENDING",
    expiresAt,
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

test("mobile hides a pending offer at its API-provided expiration", () => {
  const expiresAt = new Date(nowMs + 1_000).toISOString();
  const offer = pending(expiresAt);

  assert.equal(isPendingDispatchActive(offer, nowMs), true);
  assert.equal(isPendingDispatchActive(offer, nowMs + 1_000), false);
  assert.equal(pendingDispatchExpirationMs(offer), nowMs + 1_000);
});
