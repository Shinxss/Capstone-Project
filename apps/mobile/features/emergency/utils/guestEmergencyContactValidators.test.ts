import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePhilippineMobileNumber,
  validateGuestEmergencyContact,
} from "./guestEmergencyContactValidators";

test("normalizes both supported Philippine mobile formats", () => {
  assert.equal(normalizePhilippineMobileNumber("09123456789"), "+639123456789");
  assert.equal(normalizePhilippineMobileNumber("+63 912 345 6789"), "+639123456789");
});

test("validates and trims a guest emergency contact", () => {
  const result = validateGuestEmergencyContact({
    fullName: "  Juan   Dela Cruz  ",
    phoneNumber: "09123456789",
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.value, {
    fullName: "Juan Dela Cruz",
    phoneNumber: "+639123456789",
  });
});

test("rejects missing names and invalid mobile numbers", () => {
  const result = validateGuestEmergencyContact({
    fullName: " ",
    phoneNumber: "12345",
  });

  assert.equal(result.value, null);
  assert.ok(result.errors.fullName);
  assert.ok(result.errors.phoneNumber);
});
