import { randomBytes } from "crypto";
import { EmergencyReportModel } from "../models/EmergencyReport.model";

export const MAX_REFERENCE_ATTEMPTS = 5;

function randomChunk(size = 6): string {
  const raw = BigInt(`0x${randomBytes(8).toString("hex")}`)
    .toString(36)
    .toUpperCase();
  return raw.replace(/[^A-Z0-9]/g, "").padStart(size, "0").slice(-size);
}

export function generateReferenceNumberCandidate(date = new Date()): string {
  return `EM-${date.getUTCFullYear()}-${randomChunk(6)}`;
}

export async function generateUniqueReferenceNumber(): Promise<string> {
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    const referenceNumber = generateReferenceNumberCandidate();
    const existing = await EmergencyReportModel.exists({ referenceNumber });
    if (!existing) return referenceNumber;
  }

  throw new Error("Failed to generate unique reference number");
}
