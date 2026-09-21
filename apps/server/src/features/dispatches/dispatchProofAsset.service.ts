import fs from "fs";
import path from "path";
import { decryptBuffer, encryptBuffer } from "../../utils/aesGcm";
import { DispatchProofAsset } from "./dispatchProofAsset.model";

export type DispatchProofMimeType = "image/png" | "image/jpeg" | "image/heic";

export async function storeDispatchProofAsset(params: {
  filename: string;
  dispatchId: string;
  mimeType: DispatchProofMimeType;
  buffer: Buffer;
}): Promise<void> {
  const encrypted = encryptBuffer(params.buffer);
  const absolutePath = path.join(ensureDispatchProofsDir(), params.filename);

  await fs.promises.writeFile(absolutePath, encrypted);

  try {
    await DispatchProofAsset.findOneAndUpdate(
      { filename: params.filename },
      {
        $set: {
          filename: params.filename,
          dispatchId: params.dispatchId,
          mimeType: params.mimeType,
          payload: encrypted,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    await fs.promises.unlink(absolutePath).catch(() => undefined);
    throw error;
  }
}

export async function removeDispatchProofAsset(filename: string): Promise<void> {
  const safeFilename = toSafeFilename(filename);
  if (!safeFilename) return;

  const absolutePath = path.join(ensureDispatchProofsDir(), safeFilename);
  await fs.promises.unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
  await DispatchProofAsset.deleteOne({ filename: safeFilename });
}

export async function readDispatchProofAsset(filename: string): Promise<{
  buffer: Buffer;
  mimeType: DispatchProofMimeType;
} | null> {
  const safeFilename = toSafeFilename(filename);
  if (!safeFilename) return null;

  const absolutePath = path.join(ensureDispatchProofsDir(), safeFilename);
  let encrypted: Buffer | null = null;
  let storedMimeType: DispatchProofMimeType | null = null;

  try {
    encrypted = await fs.promises.readFile(absolutePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (!encrypted) {
    const stored = await DispatchProofAsset.findOne({ filename: safeFilename })
      .select("+payload mimeType")
      .lean();
    if (!stored?.payload) return null;
    encrypted = Buffer.from(stored.payload as Buffer);
    storedMimeType = stored.mimeType as DispatchProofMimeType;
  } else {
    storedMimeType = mimeTypeForProofFilename(safeFilename);

    // Preserve legacy filesystem-only proofs before the next restart/redeploy.
    await DispatchProofAsset.updateOne(
      { filename: safeFilename },
      {
        $setOnInsert: {
          filename: safeFilename,
          dispatchId: dispatchIdFromProofFilename(safeFilename),
          mimeType: storedMimeType,
          payload: encrypted,
        },
      },
      { upsert: true },
    ).catch(() => undefined);
  }

  let buffer: Buffer;
  try {
    buffer = decryptBuffer(encrypted);
  } catch {
    buffer = encrypted;
  }

  return {
    buffer,
    mimeType: storedMimeType ?? mimeTypeForProofFilename(safeFilename),
  };
}

export async function dispatchProofAssetExists(proofUrl: string): Promise<boolean> {
  const filename = filenameFromDispatchProofUrl(proofUrl);
  if (!filename) return true;

  const absolutePath = path.join(ensureDispatchProofsDir(), filename);
  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK);
    return true;
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }

  return Boolean(await DispatchProofAsset.exists({ filename }));
}

function ensureDispatchProofsDir() {
  const dir = path.join(process.cwd(), "uploads", "dispatch-proofs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function toSafeFilename(filename: string) {
  const requested = String(filename ?? "");
  const safeFilename = path.basename(requested);
  return safeFilename && safeFilename === requested ? safeFilename : null;
}

function filenameFromDispatchProofUrl(proofUrl: string) {
  const raw = String(proofUrl ?? "").trim();
  if (!raw) return null;

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      return null;
    }
  }

  const prefix = "/uploads/dispatch-proofs/";
  if (!pathname.startsWith(prefix)) return null;
  return toSafeFilename(pathname.slice(prefix.length));
}

function dispatchIdFromProofFilename(filename: string) {
  return filename.split("_", 1)[0] || "legacy";
}

function mimeTypeForProofFilename(filename: string): DispatchProofMimeType {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".heic") return "image/heic";
  return "image/jpeg";
}
