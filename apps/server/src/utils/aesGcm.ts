import crypto from "crypto";

/**
 * AES-256-GCM helpers for encryption-at-rest.
 *
 * Key source priority:
 *  1) AES_KEY_HEX (64 hex chars => 32 bytes)
 *  2) derived from JWT_SECRET (sha256) for dev convenience
 */
function getKey(): Buffer {
  const hex = process.env.AES_KEY_HEX;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }

  const fallback = process.env.JWT_SECRET || "lifeline-dev-secret";
  return crypto.createHash("sha256").update(fallback).digest();
}

const KEY = getKey();

export function encryptBuffer(plain: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();

  // iv (12) + tag (16) + ciphertext
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptBuffer(payload: Buffer): Buffer {
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
