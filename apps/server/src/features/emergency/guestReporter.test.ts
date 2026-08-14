import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { postEmergencyReport } from "./controllers/emergencyReport.controller";
import { createEmergencyReportSchema } from "./schemas/emergencyReport.schema";
import { normalizeGuestReporterPhone } from "./utils/guestReporter";

const baseSosPayload = {
  isSos: true,
  type: "other" as const,
  location: {
    coords: { latitude: 16.043, longitude: 120.34 },
  },
};

test("normalizes supported Philippine guest mobile formats", () => {
  assert.equal(normalizeGuestReporterPhone("09123456789"), "+639123456789");
  assert.equal(normalizeGuestReporterPhone("+63 912 345 6789"), "+639123456789");
  assert.equal(normalizeGuestReporterPhone("08123456789"), null);
});

test("guest reporter schema trims the name and stores a canonical phone number", () => {
  const parsed = createEmergencyReportSchema.parse({
    ...baseSosPayload,
    guestReporter: {
      fullName: "  Juan   Dela Cruz  ",
      phoneNumber: "09123456789",
    },
  });

  assert.deepEqual(parsed.guestReporter, {
    fullName: "Juan Dela Cruz",
    phoneNumber: "+639123456789",
  });
});

test("guest reporter schema rejects an invalid phone number", () => {
  const parsed = createEmergencyReportSchema.safeParse({
    ...baseSosPayload,
    guestReporter: {
      fullName: "Juan Dela Cruz",
      phoneNumber: "12345",
    },
  });

  assert.equal(parsed.success, false);
});

test("unauthenticated SOS without guest identity returns 400 before persistence", async () => {
  let statusCode = 200;
  let responseBody: unknown;
  const req = { body: baseSosPayload } as Request;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  await postEmergencyReport(req, res);

  assert.equal(statusCode, 400);
  assert.deepEqual(responseBody, {
    message: "Please provide your full name and mobile number before sending an SOS.",
  });
});
