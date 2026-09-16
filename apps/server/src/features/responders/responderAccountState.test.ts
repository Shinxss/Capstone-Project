import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResponderAccountCreationState,
  buildResponderAccountUpdateState,
  buildResponderActivationState,
  DISPATCHABLE_RESPONDER_STATE,
  isImpossibleResponderAccountFilter,
  isResponderDispatchableState,
  normalizeResponderAccountState,
} from "./responderAccountState";

test("suspending an on-duty responder atomically produces suspended and off-duty state", () => {
  const state = buildResponderActivationState(false);

  assert.deepEqual(state, { isActive: false, onDuty: false });
});

test("reactivating a suspended responder leaves the responder off duty", () => {
  const state = buildResponderActivationState(true);

  assert.deepEqual(state, { isActive: true, onDuty: false });
});

test("an invalid account update is normalized to suspended and off duty", () => {
  const state = buildResponderAccountUpdateState(
    { isActive: true, onDuty: true },
    { isActive: false, onDuty: true }
  );

  assert.deepEqual(state, { isActive: false, onDuty: false });
});

test("an inactive responder creation request cannot create an on-duty responder", () => {
  const state = buildResponderAccountCreationState({ isActive: false, onDuty: true });

  assert.deepEqual(state, { isActive: false, onDuty: false });
});

test("a newly created active responder starts off duty", () => {
  const state = buildResponderAccountCreationState({ isActive: true, onDuty: true });

  assert.deepEqual(state, { isActive: true, onDuty: false });
});

test("account edits cannot override responder-controlled duty status", () => {
  assert.deepEqual(
    buildResponderAccountUpdateState(
      { isActive: true, onDuty: false },
      { onDuty: true }
    ),
    { isActive: true, onDuty: false }
  );
  assert.deepEqual(
    buildResponderAccountUpdateState(
      { isActive: true, onDuty: true },
      { onDuty: false }
    ),
    { isActive: true, onDuty: true }
  );
});

test("dispatchable responder state still requires active and on-duty flags", () => {
  assert.deepEqual(DISPATCHABLE_RESPONDER_STATE, { isActive: true, onDuty: true });
  assert.equal(isResponderDispatchableState({ isActive: false, onDuty: false }), false);
  assert.equal(isResponderDispatchableState({ isActive: true, onDuty: true }), true);
});

test("legacy suspended and on-duty records are normalized before becoming DTOs", () => {
  const state = normalizeResponderAccountState({ isActive: false, onDuty: true });

  assert.deepEqual(state, { isActive: false, onDuty: false });
});

test("suspended-only and on-duty filters are recognized as impossible", () => {
  assert.equal(
    isImpossibleResponderAccountFilter({ isActive: "false", onDuty: "true" }),
    true
  );
  assert.equal(
    isImpossibleResponderAccountFilter({ isActive: "false", onDuty: "false" }),
    false
  );
});
