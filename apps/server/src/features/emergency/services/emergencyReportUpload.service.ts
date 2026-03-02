import crypto from "crypto";
import fs from "fs";
import path from "path";
import { encryptBuffer } from "../../../utils/aesGcm";

const MAX_EMERGENCY_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB after base64 decoding
const ALLOWED_EMERGENCY_PHOTO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/heic"]);
const PHOTO_HASH_ALGO = "sha256";

type DetectedPhotoType = {
  ext: "png" | "jpg" | "heic";
  mimeType: "image/png" | "image/jpeg" | "image/heic";
};

export async function uploadEmergencyReportPhoto(params: {
  base64: string;
  mimeType?: string;
  fileName?: string;
  reporterUserId?: string;
}): Promise<{ url: string; mimeType: string; fileHash: string }> {
  const parsed = parseAndValidateEmergencyPhoto({
    base64: params.base64,
    mimeType: params.mimeType,
  });

  void params.reporterUserId;
  void normalizeFileName(params.fileName);

  const dir = ensureUploadsDir();
  const filename = `er_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${parsed.ext}`;
  const abs = path.join(dir, filename);

  const encrypted = encryptBuffer(parsed.buffer);
  await fs.promises.writeFile(abs, encrypted);

  return {
    url: `/uploads/emergency-report-photos/${filename}`,
    mimeType: parsed.mimeType,
    fileHash: hashFileBytes(parsed.buffer),
  };
}

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), "uploads", "emergency-report-photos");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function normalizeFileName(fileName?: string) {
  const cleaned = String(fileName ?? "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, 255);
}

function hashFileBytes(buffer: Buffer) {
  const digest = crypto.createHash(PHOTO_HASH_ALGO).update(buffer).digest("hex").toLowerCase();
  return `0x${digest}`;
}

function parseAndValidateEmergencyPhoto(input: {
  base64: string;
  mimeType?: string;
}): { buffer: Buffer; ext: DetectedPhotoType["ext"]; mimeType: DetectedPhotoType["mimeType"] } {
  const raw = String(input.base64 ?? "").trim();
  if (!raw) throw new Error("base64 is required");

  const dataUrlMatch = raw.match(/^data:([^;,]+);base64,(.+)$/i);
  const fromDataUrl = dataUrlMatch?.[1]?.toLowerCase();
  const encoded = (dataUrlMatch?.[2] ?? raw).replace(/\s+/g, "");

  const declaredMime = String(input.mimeType ?? "").trim().toLowerCase();
  if (declaredMime && !ALLOWED_EMERGENCY_PHOTO_MIME_TYPES.has(declaredMime)) {
    throw new Error("Invalid file type");
  }

  if (fromDataUrl && !ALLOWED_EMERGENCY_PHOTO_MIME_TYPES.has(fromDataUrl)) {
    throw new Error("Invalid file type");
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(encoded) || encoded.length % 4 === 1) {
    throw new Error("Invalid file type");
  }

  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length === 0) {
    throw new Error("Invalid file type");
  }

  if (buffer.length > MAX_EMERGENCY_PHOTO_BYTES) {
    throw new Error("File too large");
  }

  const detected = detectFileTypeByMagicBytes(buffer);
  if (!detected) {
    throw new Error("Invalid file type");
  }

  if (declaredMime && detected.mimeType !== declaredMime) {
    throw new Error("Invalid file type");
  }

  if (fromDataUrl && detected.mimeType !== fromDataUrl) {
    throw new Error("Invalid file type");
  }

  return {
    buffer,
    ext: detected.ext,
    mimeType: detected.mimeType,
  };
}

function detectFileTypeByMagicBytes(buffer: Buffer): DetectedPhotoType | null {
  if (isPng(buffer)) {
    return { ext: "png", mimeType: "image/png" };
  }

  if (isJpeg(buffer)) {
    return { ext: "jpg", mimeType: "image/jpeg" };
  }

  if (isHeic(buffer)) {
    return { ext: "heic", mimeType: "image/heic" };
  }

  return null;
}

function isPng(buffer: Buffer) {
  if (buffer.length < 8) return false;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((byte, index) => buffer[index] === byte);
}

function isJpeg(buffer: Buffer) {
  if (buffer.length < 3) return false;
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isHeic(buffer: Buffer) {
  if (buffer.length < 16) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buffer.toString("ascii", 8, 12);
  return ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand);
}
