import crypto from "crypto";
import fs from "fs";
import path from "path";
import { encryptBuffer } from "../../utils/aesGcm";

const MAX_PROFILE_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB after base64 decoding
const PROFILE_AVATAR_URL_PREFIX = "/uploads/profile-avatars/";
const ALLOWED_PROFILE_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/heic"]);

type DetectedAvatarType = {
  ext: "png" | "jpg" | "heic";
  mimeType: "image/png" | "image/jpeg" | "image/heic";
};

export async function uploadUserAvatar(params: {
  userId: string;
  base64: string;
  mimeType?: string;
  fileName?: string;
}): Promise<{ url: string; mimeType: DetectedAvatarType["mimeType"] }> {
  const parsed = parseAndValidateAvatar({
    base64: params.base64,
    mimeType: params.mimeType,
  });

  void normalizeFileName(params.fileName);

  const dir = ensureAvatarUploadsDir();
  const safeUserId = sanitizeToken(params.userId);
  const filename = `avatar_${safeUserId}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${parsed.ext}`;
  const absolutePath = path.join(dir, filename);

  const encrypted = encryptBuffer(parsed.buffer);
  await fs.promises.writeFile(absolutePath, encrypted);

  return {
    url: `${PROFILE_AVATAR_URL_PREFIX}${filename}`,
    mimeType: parsed.mimeType,
  };
}

export async function removeLocalProfileAvatarFileByUrl(avatarUrl?: string | null): Promise<void> {
  const filename = extractLocalProfileAvatarFilename(avatarUrl);
  if (!filename) return;

  const dir = ensureAvatarUploadsDir();
  const absolutePath = path.join(dir, filename);
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function ensureAvatarUploadsDir() {
  const dir = path.join(process.cwd(), "uploads", "profile-avatars");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function normalizeFileName(fileName?: string) {
  const cleaned = String(fileName ?? "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, 255);
}

function sanitizeToken(value: string) {
  const cleaned = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
  return cleaned || "user";
}

function parseAndValidateAvatar(input: {
  base64: string;
  mimeType?: string;
}): { buffer: Buffer; ext: DetectedAvatarType["ext"]; mimeType: DetectedAvatarType["mimeType"] } {
  const raw = String(input.base64 ?? "").trim();
  if (!raw) throw new Error("base64 is required");

  const dataUrlMatch = raw.match(/^data:([^;,]+);base64,(.+)$/i);
  const fromDataUrl = dataUrlMatch?.[1]?.toLowerCase();
  const encoded = (dataUrlMatch?.[2] ?? raw).replace(/\s+/g, "");

  const declaredMime = String(input.mimeType ?? "").trim().toLowerCase();
  if (declaredMime && !ALLOWED_PROFILE_AVATAR_MIME_TYPES.has(declaredMime)) {
    throw new Error("Invalid file type");
  }

  if (fromDataUrl && !ALLOWED_PROFILE_AVATAR_MIME_TYPES.has(fromDataUrl)) {
    throw new Error("Invalid file type");
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(encoded) || encoded.length % 4 === 1) {
    throw new Error("Invalid file type");
  }

  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length === 0) {
    throw new Error("Invalid file type");
  }

  if (buffer.length > MAX_PROFILE_AVATAR_BYTES) {
    throw new Error("File too large");
  }

  const detected = detectFileTypeByMagicBytes(buffer);
  if (!detected) {
    throw new Error("Invalid file type");
  }

  if (declaredMime && declaredMime !== detected.mimeType) {
    throw new Error("Invalid file type");
  }

  if (fromDataUrl && fromDataUrl !== detected.mimeType) {
    throw new Error("Invalid file type");
  }

  return {
    buffer,
    ext: detected.ext,
    mimeType: detected.mimeType,
  };
}

function detectFileTypeByMagicBytes(buffer: Buffer): DetectedAvatarType | null {
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

function extractLocalProfileAvatarFilename(avatarUrl?: string | null): string | null {
  const raw = String(avatarUrl ?? "").trim();
  if (!raw) return null;

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith(PROFILE_AVATAR_URL_PREFIX)) return null;

  const requested = pathname.slice(PROFILE_AVATAR_URL_PREFIX.length);
  const filename = path.basename(requested);
  if (!filename || filename !== requested) return null;

  return filename;
}
