import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { MfaChallenge } from "../models/MfaChallenge";

const MAX_ATTEMPTS = 5;

function otp6(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "****";
  return `${name.slice(0, 2)}***@${domain}`;
}

export async function createMfaChallenge(userId: Types.ObjectId, ttlMinutes = 5) {
  const code = otp6();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const doc = await MfaChallenge.create({
    userId,
    codeHash,
    expiresAt,
    attempts: 0,
  });

  return { challengeId: String(doc._id), code, expiresAt };
}

export async function verifyMfaChallenge(challengeId: string, code: string) {
  const doc = await MfaChallenge.findById(challengeId);
  if (!doc) throw new Error("MFA session expired. Please login again.");

  if (doc.expiresAt.getTime() < Date.now()) {
    await doc.deleteOne();
    throw new Error("MFA session expired. Please login again.");
  }

  if (doc.attempts >= MAX_ATTEMPTS) {
    await doc.deleteOne();
    throw new Error("Too many attempts. Please login again.");
  }

  const ok = await bcrypt.compare(code, doc.codeHash);
  if (!ok) {
    doc.attempts += 1;
    await doc.save();
    throw new Error("Invalid OTP code.");
  }

  const userId = doc.userId;
  await doc.deleteOne(); // one-time
  return userId;
}
