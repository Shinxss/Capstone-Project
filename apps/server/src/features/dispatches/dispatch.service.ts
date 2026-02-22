import { Types } from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { encryptBuffer } from "../../utils/aesGcm";

import { EmergencyReport } from "../emergency/emergency.model";
import { User } from "../users/user.model";
import { DispatchOffer, DispatchStatus } from "./dispatch.model";
import { recordTaskVerification } from "@lifeline/blockchain";
import { sendDispatchOfferPush } from "../notifications/pushNotification.service";

const MAX_PROOF_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_PROOF_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/heic"]);

export type CreateDispatchInput = {
  emergencyId: string;
  volunteerIds: string[];
  createdByUserId: string;
};

export async function createDispatchOffers(input: CreateDispatchInput) {
  const emergencyId = String(input.emergencyId);
  if (!Types.ObjectId.isValid(emergencyId)) {
    throw new Error("Invalid emergencyId");
  }

  const emergency = await EmergencyReport.findById(emergencyId);
  if (!emergency) {
    throw new Error("Emergency not found");
  }

  // Once responders are dispatched, treat the incident as acknowledged.
  // This removes it from "active SOS alert" queues that track unhandled reports.
  const snapshotStatus = emergency.status === "OPEN" ? "ACKNOWLEDGED" : emergency.status;
  if (snapshotStatus !== emergency.status) {
    emergency.status = snapshotStatus;
    await emergency.save();
  }

  const uniqVolunteerIds = Array.from(new Set((input.volunteerIds ?? []).map(String))).filter(Boolean);
  if (uniqVolunteerIds.length === 0) {
    throw new Error("volunteerIds is required");
  }

  // Ensure volunteers exist and are approved volunteers
  const volunteers = await User.find({
    _id: { $in: uniqVolunteerIds },
    role: "VOLUNTEER",
    volunteerStatus: "APPROVED",
  }).select("_id");

  const validVolunteerIds = volunteers.map((v) => String(v._id));
  if (validVolunteerIds.length === 0) {
    throw new Error("No valid approved volunteers found");
  }

  // Avoid duplicate PENDING offers for the same emergency/volunteer pair.
  const existingPending = await DispatchOffer.find({
    emergencyId: new Types.ObjectId(emergencyId),
    volunteerId: { $in: validVolunteerIds.map((id) => new Types.ObjectId(id)) },
    status: "PENDING",
  }).select("volunteerId");

  const existingPendingVolunteerIds = new Set(existingPending.map((d) => String(d.volunteerId)));
  const dispatchableVolunteerIds = validVolunteerIds.filter((id) => !existingPendingVolunteerIds.has(id));

  if (dispatchableVolunteerIds.length === 0) {
    throw new Error("Selected volunteers are already dispatched for this emergency.");
  }

  const snapshot = {
    id: String(emergency._id),
    emergencyType: emergency.emergencyType,
    source: emergency.source,
    status: snapshotStatus,
    location: {
      type: "Point" as const,
      coordinates: emergency.location.coordinates,
    },
    notes: emergency.notes,
    reportedAt: emergency.reportedAt,
    // emergency report currently doesn't store barangayName; keep null for now
    barangayName: null,
  };

  const createdBy = new Types.ObjectId(input.createdByUserId);

  const docs = dispatchableVolunteerIds.map((volunteerId) => ({
    emergencyId: new Types.ObjectId(emergencyId),
    volunteerId: new Types.ObjectId(volunteerId),
    createdBy,
    status: "PENDING" as DispatchStatus,
    emergencySnapshot: snapshot,
  }));

  let created: any[] = [];
  try {
    created = await DispatchOffer.insertMany(docs);
  } catch (error: any) {
    const isDuplicate = error?.code === 11000 || String(error?.message ?? "").includes("E11000");
    if (isDuplicate) {
      throw new Error("Selected volunteers are already dispatched for this emergency.");
    }
    throw error;
  }

  try {
    const pushResult = await sendDispatchOfferPush({
      volunteerUserIds: dispatchableVolunteerIds,
      emergencyId,
      emergencyType: String(emergency.emergencyType || "Emergency"),
    });
    console.info("[push] dispatch send result", {
      emergencyId,
      volunteerCount: dispatchableVolunteerIds.length,
      attempted: pushResult.attempted,
      sent: pushResult.sent,
    });
  } catch (error: any) {
    console.warn("[push] dispatch send failed", {
      emergencyId,
      volunteerCount: dispatchableVolunteerIds.length,
      message: error?.message,
    });
  }

  return created;
}

export async function getMyPendingDispatch(volunteerUserId: string) {
  return DispatchOffer.findOne({
    volunteerId: new Types.ObjectId(volunteerUserId),
    status: "PENDING",
  }).sort({ createdAt: -1 });
}

// For map: only ACCEPTED is "active"
export async function getMyActiveDispatch(volunteerUserId: string) {
  return DispatchOffer.findOne({
    volunteerId: new Types.ObjectId(volunteerUserId),
    status: "ACCEPTED",
  }).sort({ updatedAt: -1 });
}

// For tasks screen: show ACCEPTED or DONE (waiting for review)
export async function getMyCurrentDispatch(volunteerUserId: string) {
  return DispatchOffer.findOne({
    volunteerId: new Types.ObjectId(volunteerUserId),
    status: { $in: ["ACCEPTED", "DONE"] },
  }).sort({ updatedAt: -1 });
}

export async function respondToDispatch(params: {
  dispatchId: string;
  volunteerUserId: string;
  decision: "ACCEPT" | "DECLINE";
}) {
  const { dispatchId, volunteerUserId, decision } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) {
    throw new Error("Dispatch offer not found");
  }

  if (String(offer.volunteerId) !== String(volunteerUserId)) {
    throw new Error("Not allowed");
  }

  if (offer.status !== "PENDING") {
    throw new Error("Dispatch offer is not pending");
  }

  if (decision === "ACCEPT") {
    offer.status = "ACCEPTED";
  } else {
    offer.status = "DECLINED";
  }

  offer.respondedAt = new Date();
  await offer.save();

  // If accepted, cancel any other pending offers for this volunteer
  if (decision === "ACCEPT") {
    await DispatchOffer.updateMany(
      {
        _id: { $ne: offer._id },
        volunteerId: offer.volunteerId,
        status: "PENDING",
      },
      { $set: { status: "CANCELLED", respondedAt: new Date() } }
    );
  }

  return offer;
}

export async function addProofToDispatch(params: {
  dispatchId: string;
  volunteerUserId: string;
  base64: string;
  mimeType?: string;
  fileName?: string;
}) {
  const { dispatchId, volunteerUserId, base64, mimeType, fileName } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");
  if (String(offer.volunteerId) !== String(volunteerUserId)) throw new Error("Not allowed");

  if (!["ACCEPTED", "DONE"].includes(offer.status)) {
    throw new Error("You can only upload proof for an accepted/done task");
  }

  const parsedProof = parseAndValidateProof({
    base64: String(base64 || ""),
    mimeType: mimeType ? String(mimeType) : undefined,
    fileName: fileName ? String(fileName) : undefined,
  });
  const dir = ensureUploadsDir();
  const filename = `${dispatchId}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${parsedProof.ext}`;
  const abs = path.join(dir, filename);

  // Encrypt before writing to disk (encryption-at-rest)
  const encrypted = encryptBuffer(parsedProof.buffer);
  fs.writeFileSync(abs, encrypted);

  const url = `/uploads/dispatch-proofs/${filename}`;
  (offer.proofs as any) = Array.isArray(offer.proofs) ? offer.proofs : [];
  offer.proofs.push({
    url,
    uploadedAt: new Date(),
    mimeType: parsedProof.mimeTypeDetected,
    fileName: normalizeProofFileName(fileName),
  } as any);
  await offer.save();

  return offer;
}

export async function completeDispatch(params: { dispatchId: string; volunteerUserId: string }) {
  const { dispatchId, volunteerUserId } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");
  if (String(offer.volunteerId) !== String(volunteerUserId)) throw new Error("Not allowed");

  if (offer.status !== "ACCEPTED") {
    throw new Error("Only accepted tasks can be marked as done");
  }

  offer.status = "DONE";
  offer.completedAt = new Date();
  await offer.save();

  return offer;
}

export async function verifyDispatch(
  params: { dispatchId: string; verifierUserId: string }
): Promise<{
  txHash: string;
  dispatchId: string;
  emergencyId: string;
  volunteerId: string;
  completedAt: string | null;
  alreadyVerified?: boolean;
}> {
  const { dispatchId, verifierUserId } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");

  // Idempotent: if already verified, just return the stored txHash (if available).
  if (offer.status === "VERIFIED") {
    const existingTxHash = (offer as any).chainRecord?.txHash;
    return {
      txHash: typeof existingTxHash === "string" ? existingTxHash : "already-verified",
      dispatchId: String(offer._id),
      emergencyId: String(offer.emergencyId),
      volunteerId: String(offer.volunteerId),
      completedAt: offer.completedAt ? new Date(offer.completedAt).toISOString() : null,
      alreadyVerified: true,
    };
  }

  if (offer.status !== "DONE") {
    // "DONE" is the current codebase equivalent of "FOR_REVIEW".
    throw new Error("Only DONE (FOR_REVIEW) tasks can be verified");
  }

  // Blockchain write (hash-only) BEFORE we mark VERIFIED in DB.
  // If chain write fails, we keep the task in DONE state so LGU can retry.
  const proofUrls = Array.isArray((offer as any).proofs)
    ? (offer as any).proofs.map((p: any) => String(p?.url || "")).filter(Boolean).sort()
    : [];

  const payload = {
    dispatchId: String(offer._id),
    emergencyId: String(offer.emergencyId),
    volunteerId: String(offer.volunteerId),
    completedAt: offer.completedAt ? new Date(offer.completedAt).toISOString() : null,
    proofUrls,
  };

  const rpcUrl = mustEnv("SEPOLIA_RPC_URL");
  const privateKey = mustEnv("SEPOLIA_PRIVATE_KEY");
  const contractAddress = mustEnv("TASK_LEDGER_CONTRACT_ADDRESS").trim();

  const chain = await recordTaskVerification({
    rpcUrl,
    privateKey,
    contractAddress,
    taskId: String(offer._id),
    payload,
  });

  offer.status = "VERIFIED";
  offer.verifiedAt = new Date();
  offer.verifiedBy = new Types.ObjectId(verifierUserId);
  (offer as any).chainRecord = {
    network: "sepolia",
    contractAddress,
    txHash: chain.txHash,
    blockNumber: chain.blockNumber,
    taskIdHash: chain.taskIdHash,
    payloadHash: chain.payloadHash,
    recordedAt: new Date(),
  };
  await offer.save();

  // Optional: mark emergency resolved when at least one task is verified
  try {
    await EmergencyReport.updateOne({ _id: offer.emergencyId }, { $set: { status: "RESOLVED" } });
  } catch {
    // ignore
  }

  return {
    txHash: chain.txHash,
    dispatchId: String(offer._id),
    emergencyId: String(offer.emergencyId),
    volunteerId: String(offer.volunteerId),
    completedAt: offer.completedAt ? new Date(offer.completedAt).toISOString() : null,
  };
}

export async function listDispatchTasksForLgu(params: { statuses: DispatchStatus[] }) {
  const statuses = (params.statuses ?? []).filter(Boolean);
  const query: any = {};
  if (statuses.length) query.status = { $in: statuses };

  return DispatchOffer.find(query)
    .populate({ path: "volunteerId", select: "firstName lastName email" })
    .sort({ updatedAt: -1 })
    .lean();
}

export function toDispatchDTO(doc: any) {
  if (!doc) return null;

  const snap = doc.emergencySnapshot;
  const coords = snap?.location?.coordinates ?? [0, 0];

  const vol = doc.volunteerId;
  const volunteer = vol
    ? {
        id: String(vol._id ?? vol),
        name: [vol.firstName, vol.lastName].filter(Boolean).join(" ").trim() || vol.email || "Volunteer",
      }
    : null;

  return {
    id: String(doc._id),
    status: doc.status,
    respondedAt: doc.respondedAt ?? null,
    completedAt: doc.completedAt ?? null,
    verifiedAt: doc.verifiedAt ?? null,
    chainRecord: doc.chainRecord ?? null,
    proofs: Array.isArray(doc.proofs) ? doc.proofs : [],
    volunteer,
    emergency: {
      id: String(snap?.id ?? doc.emergencyId),
      emergencyType: snap?.emergencyType,
      source: snap?.source,
      status: snap?.status,
      lng: coords[0],
      lat: coords[1],
      notes: snap?.notes ?? null,
      reportedAt: snap?.reportedAt,
      barangayName: snap?.barangayName ?? null,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), "uploads", "dispatch-proofs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function normalizeProofFileName(fileName?: string) {
  const cleaned = String(fileName ?? "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, 255);
}

function parseAndValidateProof(input: { base64: string; mimeType?: string; fileName?: string }) {
  const raw = String(input.base64 ?? "").trim();
  if (!raw) throw new Error("base64 is required");

  const dataUrlMatch = raw.match(/^data:([^;,]+);base64,(.+)$/i);
  const fromDataUrl = dataUrlMatch?.[1]?.toLowerCase();
  const encoded = (dataUrlMatch?.[2] ?? raw).replace(/\s+/g, "");

  const declaredMime = String(input.mimeType ?? "").trim().toLowerCase();
  if (declaredMime && !ALLOWED_PROOF_MIME_TYPES.has(declaredMime)) {
    throw new Error("Invalid file type");
  }

  if (fromDataUrl && !ALLOWED_PROOF_MIME_TYPES.has(fromDataUrl)) {
    throw new Error("Invalid file type");
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(encoded) || encoded.length % 4 === 1) {
    throw new Error("Invalid file type");
  }

  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length === 0) {
    throw new Error("Invalid file type");
  }

  if (buffer.length > MAX_PROOF_BYTES) {
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
    mimeTypeDetected: detected.mimeType,
  };
}

function detectFileTypeByMagicBytes(buffer: Buffer): { ext: "png" | "jpg" | "heic"; mimeType: "image/png" | "image/jpeg" | "image/heic" } | null {
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

function mustEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}
