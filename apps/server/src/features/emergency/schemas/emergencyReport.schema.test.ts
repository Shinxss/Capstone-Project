import assert from "node:assert/strict";
import test from "node:test";
import { createEmergencyReportSchema } from "./emergencyReport.schema";

const baseReportPayload = {
  isSos: false,
  type: "fire" as const,
  location: {
    coords: { latitude: 16.043, longitude: 120.34 },
  },
};

test("regular emergency report rejects zero proof photos", () => {
  const parsed = createEmergencyReportSchema.safeParse({
    ...baseReportPayload,
    photos: [],
  });

  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.equal(parsed.error.issues[0]?.message, "Exactly one proof photo is required.");
  }
});

test("regular emergency report accepts exactly one proof photo", () => {
  const parsed = createEmergencyReportSchema.safeParse({
    ...baseReportPayload,
    photos: ["/uploads/emergency-report-photos/proof.jpg"],
  });

  assert.equal(parsed.success, true);
});

test("regular emergency report rejects two proof photos", () => {
  const parsed = createEmergencyReportSchema.safeParse({
    ...baseReportPayload,
    photos: [
      "/uploads/emergency-report-photos/proof-1.jpg",
      "/uploads/emergency-report-photos/proof-2.jpg",
    ],
  });

  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.equal(parsed.error.issues[0]?.message, "Exactly one proof photo is required.");
  }
});

test("SOS remains valid without proof photos", () => {
  const parsed = createEmergencyReportSchema.safeParse({
    ...baseReportPayload,
    isSos: true,
    type: "other",
    guestReporter: {
      fullName: "Juan Dela Cruz",
      phoneNumber: "09123456789",
    },
  });

  assert.equal(parsed.success, true);
});
