import assert from "node:assert/strict";
import test from "node:test";
import {
  isResponderDutyControlDisabled,
  isResponderEffectivelyOnDuty,
  setResponderAccountActive,
} from "../src/features/responderAccounts/models/responderAccountState";

test("unchecking Active account clears duty and disables the effective duty state", () => {
  const state = setResponderAccountActive({ isActive: true, onDuty: true }, false);

  assert.deepEqual(state, { isActive: false, onDuty: false });
  assert.equal(isResponderEffectivelyOnDuty(state), false);
  assert.equal(isResponderDutyControlDisabled(state), true);
});

test("checking Active account again does not restore duty", () => {
  const suspended = setResponderAccountActive({ isActive: true, onDuty: true }, false);
  const reactivated = setResponderAccountActive(suspended, true);

  assert.deepEqual(reactivated, { isActive: true, onDuty: false });
  assert.equal(isResponderDutyControlDisabled(reactivated), false);
});

test("legacy suspended and on-duty API state is presented as off duty", () => {
  assert.equal(isResponderEffectivelyOnDuty({ isActive: false, onDuty: true }), false);
});
