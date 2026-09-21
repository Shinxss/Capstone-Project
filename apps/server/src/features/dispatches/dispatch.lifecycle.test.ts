import assert from "node:assert/strict";
import test from "node:test";
import { DISPATCH_PENDING_RESPONSE_TIMEOUT_MS } from "./dispatch.constants";
import {
  getDispatchOfferExpiresAt,
  isPendingOfferActive,
  isResponderBlockingDispatch,
} from "./dispatch.lifecycle";
import { DispatchOffer } from "./dispatch.model";

const nowMs = Date.parse("2026-09-21T12:00:00.000Z");

test("pending offers block only until their backend-defined expiration", () => {
  const pending = {
    status: "PENDING",
    createdAt: new Date(nowMs - 1_000),
    expiresAt: new Date(nowMs + 1_000),
  };

  assert.equal(isPendingOfferActive(pending, nowMs), true);
  assert.equal(isResponderBlockingDispatch(pending, nowMs), true);
  assert.equal(isPendingOfferActive(pending, nowMs + 1_000), false);
  assert.equal(isResponderBlockingDispatch(pending, nowMs + 1_000), false);
});

test("legacy pending offers derive expiration from createdAt and the server timeout", () => {
  const createdAt = new Date(nowMs - 10_000);
  assert.equal(
    getDispatchOfferExpiresAt({ createdAt })?.getTime(),
    createdAt.getTime() + DISPATCH_PENDING_RESPONSE_TIMEOUT_MS,
  );
});

test("accepted and done dispatches block while terminal statuses do not", () => {
  assert.equal(isResponderBlockingDispatch({ status: "ACCEPTED" }, nowMs), true);
  assert.equal(isResponderBlockingDispatch({ status: "DONE" }, nowMs), true);
  assert.equal(isResponderBlockingDispatch({ status: "DECLINED" }, nowMs), false);
  assert.equal(isResponderBlockingDispatch({ status: "CANCELLED" }, nowMs), false);
  assert.equal(isResponderBlockingDispatch({ status: "VERIFIED" }, nowMs), false);
});

test("dispatch schema declares a unique partial index for blocking assignments", () => {
  type LifecycleIndex = [
    Record<string, unknown>,
    { name?: string; unique?: boolean; partialFilterExpression?: unknown },
  ];
  const indexes = DispatchOffer.schema.indexes() as LifecycleIndex[];
  const lifecycleIndex = indexes.find(
    ([, options]) => options.name === "one_blocking_dispatch_per_emergency_responder",
  );

  assert.ok(lifecycleIndex);
  assert.equal(lifecycleIndex[1].unique, true);
  assert.deepEqual(lifecycleIndex[1].partialFilterExpression, {
    status: { $in: ["PENDING", "ACCEPTED", "DONE"] },
  });
});
