import { Types } from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashTaskPayload } from "@lifeline/blockchain";

import { encryptBuffer } from "../../utils/aesGcm";

import { EmergencyReport } from "../emergency/emergency.model";
import { User } from "../users/user.model";
import { DispatchOffer, DispatchStatus } from "./dispatch.model";
import { sendDispatchOfferPush } from "../notifications/pushNotification.service";
import { getDispatchPendingResponseCutoffDate } from "./dispatch.constants";
import {
  emitRequestTrackingUpdate,
  emitUserNotification,
  syncVolunteerBusyState,
} from "../../realtime/notificationsSocket";
import { findBarangayByPoint } from "../barangays/barangay.service";
import { notifyRequestTrackingUpdated } from "../emergency/services/requestRealtime.service";
import {
  DISPATCH_CHAIN_DOMAIN,
  DISPATCH_CHAIN_SCHEMA_VERSION,
  buildDispatchVerificationPayload,
  normalizeStringArray,
  readDispatchTaskVerificationOnChain,
  reverifyDispatchTaskOnChain,
  revokeDispatchTaskOnChain,
  verifyDispatchTaskOnChain,
} from "../blockchain/taskLedger";

const MAX_PROOF_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_PROOF_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/heic"]);
const PROOF_HASH_ALGO = "sha256";

export type DispatchReverifyOverrides = {
  completedAt?: string | null;
  proofUrls?: string[];
  proofFileHashes?: string[];
};

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
  const pendingCutoff = getDispatchPendingResponseCutoffDate();
  const existingPending = await DispatchOffer.find({
    emergencyId: new Types.ObjectId(emergencyId),
    volunteerId: { $in: validVolunteerIds.map((id) => new Types.ObjectId(id)) },
    status: "PENDING",
    createdAt: { $gte: pendingCutoff },
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
    barangayName: null as string | null,
  };

  const [lng, lat] = emergency.location.coordinates ?? [];
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    const barangay = await findBarangayByPoint(Number(lng), Number(lat), { city: "Dagupan City" });
    snapshot.barangayName = barangay?.name ? String(barangay.name) : null;
  }

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
    const dispatchByVolunteerId = created.reduce<Record<string, string>>((acc, item: any) => {
      const volunteerId = String(item?.volunteerId ?? "").trim();
      const dispatchId = String(item?._id ?? "").trim();
      if (Types.ObjectId.isValid(volunteerId) && Types.ObjectId.isValid(dispatchId)) {
        acc[volunteerId] = dispatchId;
      }
      return acc;
    }, {});

    const pushResult = await sendDispatchOfferPush({
      volunteerUserIds: dispatchableVolunteerIds,
      emergencyId,
      emergencyType: String(emergency.emergencyType || "Emergency"),
      dispatchByVolunteerId,
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

  await Promise.allSettled(
    created.map(async (offer: any) => {
      const volunteerUserId = String(offer?.volunteerId ?? "").trim();
      const dispatchId = String(offer?._id ?? "").trim();
      if (!Types.ObjectId.isValid(volunteerUserId) || !Types.ObjectId.isValid(dispatchId)) return;

      emitUserNotification(volunteerUserId, "notify:dispatch_offer", {
        type: "DISPATCH_OFFER",
        dispatchId,
        requestId: emergencyId,
        screen: "task-details",
        title: "New dispatch assignment",
        body: "You have a new emergency assignment. Tap to respond.",
      });

      await syncVolunteerBusyState(volunteerUserId);
    })
  );

  await notifyRequestTrackingUpdated(emergencyId, "dispatch_assigned", {
    stepOverride: "Assigned",
  }).catch(() => undefined);

  return created;
}

export async function getMyPendingDispatch(volunteerUserId: string) {
  const pendingCutoff = getDispatchPendingResponseCutoffDate();
  return DispatchOffer.findOne({
    volunteerId: new Types.ObjectId(volunteerUserId),
    status: "PENDING",
    createdAt: { $gte: pendingCutoff },
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

  const pendingCutoff = getDispatchPendingResponseCutoffDate();
  const offerCreatedAtMs = offer.createdAt ? new Date(offer.createdAt).getTime() : Number.NaN;
  const isExpiredPending =
    offer.status === "PENDING" &&
    Number.isFinite(offerCreatedAtMs) &&
    offerCreatedAtMs < pendingCutoff.getTime();
  if (isExpiredPending) {
    offer.status = "CANCELLED";
    offer.respondedAt = new Date();
    await offer.save();
    await syncVolunteerBusyState(String(offer.volunteerId)).catch(() => undefined);
    throw new Error("Dispatch offer timed out");
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

    await notifyRequestTrackingUpdated(String(offer.emergencyId), "responder_en_route", {
      stepOverride: "En Route",
    }).catch(() => undefined);
  }

  await syncVolunteerBusyState(String(offer.volunteerId)).catch(() => undefined);

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
  const proofFileHash = hashProofFileBytes(parsedProof.buffer);
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
    fileHash: proofFileHash,
  } as any);
  (offer as any).proofFileHashes = extractProofFileHashes(offer);
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

  await syncVolunteerBusyState(String(offer.volunteerId)).catch(() => undefined);
  await notifyRequestTrackingUpdated(String(offer.emergencyId), "responder_arrived", {
    stepOverride: "Arrived",
  }).catch(() => undefined);

  return offer;
}

export async function updateDispatchResponderLocation(params: {
  dispatchId: string;
  volunteerUserId: string;
  lng: number;
  lat: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}) {
  const { dispatchId, volunteerUserId, lng, lat, accuracy, heading, speed } = params;
  const normalizedLng = Number(lng);
  const normalizedLat = Number(lat);

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }
  if (!Number.isFinite(normalizedLng) || !Number.isFinite(normalizedLat)) {
    throw new Error("Invalid responder location coordinates");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");
  if (String(offer.volunteerId) !== String(volunteerUserId)) throw new Error("Not allowed");

  if (!["ACCEPTED", "DONE", "VERIFIED"].includes(String(offer.status))) {
    throw new Error("Dispatch is not active");
  }

  offer.set("lastKnownLocation", {
    type: "Point",
    coordinates: [normalizedLng, normalizedLat],
    ...(Number.isFinite(accuracy) ? { accuracy: Number(accuracy) } : {}),
    ...(Number.isFinite(heading) ? { heading: Number(heading) } : {}),
    ...(Number.isFinite(speed) ? { speed: Number(speed) } : {}),
  });
  offer.lastKnownLocationAt = new Date();
  await offer.save();

  await emitRequestTrackingUpdate(String(offer.emergencyId), "responder_location").catch(() => undefined);

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
  taskIdHash: string;
  payloadHash: string;
  revoked: boolean;
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
    const existingTxHash =
      String((offer as any).blockchain?.verifiedTxHash || "") ||
      String((offer as any).chainRecord?.txHash || "");
    const existingTaskIdHash =
      String((offer as any).blockchain?.taskIdHash || "") ||
      String((offer as any).chainRecord?.taskIdHash || "");
    const existingPayloadHash =
      String((offer as any).blockchain?.payloadHash || "") ||
      String((offer as any).chainRecord?.payloadHash || "");
    const revoked = Boolean((offer as any).blockchain?.revoked);
    return {
      txHash: existingTxHash || "already-verified",
      dispatchId: String(offer._id),
      emergencyId: String(offer.emergencyId),
      volunteerId: String(offer.volunteerId),
      completedAt: offer.completedAt ? new Date(offer.completedAt).toISOString() : null,
      taskIdHash: existingTaskIdHash,
      payloadHash: existingPayloadHash,
      revoked,
      alreadyVerified: true,
    };
  }

  if (offer.status !== "DONE") {
    // "DONE" is the current codebase equivalent of "FOR_REVIEW".
    throw new Error("Only DONE (FOR_REVIEW) tasks can be verified");
  }

  // Blockchain write (hash-only) BEFORE we mark VERIFIED in DB.
  // If chain write fails, we keep the task in DONE state so LGU can retry.
  const payload = buildVerificationPayloadFromOffer(offer);
  const expectedPayloadHash = normalizeHashValue(hashTaskPayload(payload));
  const taskId = String(offer._id);
  let chainState = await readDispatchTaskVerificationOnChain({ taskId });
  let chainWrite: Awaited<ReturnType<typeof verifyDispatchTaskOnChain>> | null = null;

  if (!chainState.verified) {
    try {
      chainWrite = await verifyDispatchTaskOnChain({
        taskId,
        payload,
      });
      chainState = {
        taskIdHash: chainWrite.taskIdHash,
        payloadHash: chainWrite.payloadHash,
        verified: true,
        revoked: false,
        network: chainWrite.network,
        contractAddress: chainWrite.contractAddress,
      };
    } catch (error: any) {
      if (!isAlreadyVerifiedChainError(error)) throw error;
      chainState = await readDispatchTaskVerificationOnChain({ taskId });
      if (!chainState.verified) throw error;
    }
  }

  const onChainPayloadHash = normalizeHashValue(chainState.payloadHash);
  if (!onChainPayloadHash) {
    throw new Error("Failed to read on-chain task payload hash");
  }
  if (onChainPayloadHash !== expectedPayloadHash) {
    throw new Error("Task already verified on-chain with a different payload. Use admin reverify.");
  }

  const existingBlockchain = ((offer as any).blockchain ?? {}) as any;
  const existingChainRecord = ((offer as any).chainRecord ?? {}) as any;
  const resolvedNetwork = chainWrite?.network || chainState.network;
  const resolvedContractAddress = chainWrite?.contractAddress || chainState.contractAddress;
  const resolvedTaskIdHash = chainWrite?.taskIdHash || chainState.taskIdHash;
  const resolvedPayloadHash = onChainPayloadHash;
  const existingVerifiedTxHash = String(existingBlockchain.verifiedTxHash || existingChainRecord.txHash || "").trim();
  const resolvedTxHash = String(chainWrite?.txHash || existingVerifiedTxHash || "already-on-chain");
  const resolvedBlockTime =
    (chainWrite ? toDateFromBlockTimestamp(chainWrite.blockTimestamp) : undefined) ??
    existingBlockchain.verifiedAtBlockTime;
  const resolvedRecordedAt =
    (chainWrite ? toDateFromBlockTimestamp(chainWrite.blockTimestamp) : undefined) ??
    existingChainRecord.recordedAt ??
    new Date();
  const alreadyVerifiedOnChain = chainWrite === null;

  offer.status = "VERIFIED";
  offer.verifiedAt = new Date();
  offer.verifiedBy = new Types.ObjectId(verifierUserId);
  (offer as any).proofFileHashes = payload.proofFileHashes;
  (offer as any).blockchain = {
    network: resolvedNetwork,
    contractAddress: resolvedContractAddress,
    schemaVersion: payload.schemaVersion,
    domain: payload.domain,
    taskIdHash: resolvedTaskIdHash,
    payloadHash: resolvedPayloadHash,
    ...(resolvedTxHash ? { verifiedTxHash: resolvedTxHash } : {}),
    ...(resolvedBlockTime ? { verifiedAtBlockTime: resolvedBlockTime } : {}),
    verifierAddress: chainWrite?.signerAddress || existingBlockchain.verifierAddress || undefined,
    revoked: false,
  };
  (offer as any).chainRecord = {
    network: resolvedNetwork,
    contractAddress: resolvedContractAddress,
    ...(resolvedTxHash ? { txHash: resolvedTxHash } : {}),
    ...(typeof chainWrite?.blockNumber === "number" ? { blockNumber: chainWrite.blockNumber } : {}),
    taskIdHash: resolvedTaskIdHash,
    payloadHash: resolvedPayloadHash,
    recordHash: resolvedPayloadHash,
    recordedAt: resolvedRecordedAt,
    revoked: false,
  };
  await offer.save();

  // Optional: mark emergency resolved when at least one task is verified
  try {
    await EmergencyReport.updateOne({ _id: offer.emergencyId }, { $set: { status: "RESOLVED" } });
  } catch {
    // ignore
  }

  await syncVolunteerBusyState(String(offer.volunteerId)).catch(() => undefined);
  await notifyRequestTrackingUpdated(String(offer.emergencyId), "request_resolved", {
    stepOverride: "Resolved",
  }).catch(() => undefined);

  return {
    txHash: resolvedTxHash,
    dispatchId: String(offer._id),
    emergencyId: String(offer.emergencyId),
    volunteerId: String(offer.volunteerId),
    completedAt: offer.completedAt ? new Date(offer.completedAt).toISOString() : null,
    taskIdHash: resolvedTaskIdHash,
    payloadHash: resolvedPayloadHash,
    revoked: false,
    ...(alreadyVerifiedOnChain ? { alreadyVerified: true } : {}),
  };
}

export async function revokeDispatchVerification(params: {
  dispatchId: string;
  adminUserId: string;
  reason: string;
}) {
  const { dispatchId, reason } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const normalizedReason = String(reason || "").trim();
  if (!normalizedReason) {
    throw new Error("reason is required");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");

  const existingVerifiedTxHash = String((offer as any).blockchain?.verifiedTxHash || (offer as any).chainRecord?.txHash || "").trim();
  if (!existingVerifiedTxHash) {
    throw new Error("Task is not verified on-chain");
  }

  const chain = await revokeDispatchTaskOnChain({
    taskId: String(offer._id),
    reason: normalizedReason,
  });

  const existingBlockchain = ((offer as any).blockchain ?? {}) as any;
  (offer as any).blockchain = {
    network: chain.network,
    contractAddress: chain.contractAddress,
    schemaVersion: String(existingBlockchain.schemaVersion || DISPATCH_CHAIN_SCHEMA_VERSION),
    domain: String(existingBlockchain.domain || DISPATCH_CHAIN_DOMAIN),
    taskIdHash: chain.taskIdHash,
    payloadHash: String(existingBlockchain.payloadHash || (offer as any).chainRecord?.payloadHash || ""),
    verifiedTxHash: String(existingBlockchain.verifiedTxHash || (offer as any).chainRecord?.txHash || ""),
    verifiedAtBlockTime: existingBlockchain.verifiedAtBlockTime,
    verifierAddress: existingBlockchain.verifierAddress,
    revoked: true,
    revokedReasonHash: chain.reasonHash,
    revokedTxHash: chain.txHash,
    revokedAtBlockTime: toDateFromBlockTimestamp(chain.blockTimestamp),
    reverifiedTxHash: existingBlockchain.reverifiedTxHash,
  };
  (offer as any).chainRecord = {
    ...(offer as any).chainRecord,
    revoked: true,
  };
  await offer.save();

  return {
    txHash: chain.txHash,
    dispatchId: String(offer._id),
    taskIdHash: chain.taskIdHash,
    reasonHash: chain.reasonHash,
    revoked: true,
  };
}

export async function reverifyDispatch(params: {
  dispatchId: string;
  adminUserId: string;
  overrides?: DispatchReverifyOverrides;
}) {
  const { dispatchId, adminUserId, overrides } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");

  const existingVerifiedTxHash = String((offer as any).blockchain?.verifiedTxHash || (offer as any).chainRecord?.txHash || "").trim();
  if (!existingVerifiedTxHash) {
    throw new Error("Task is not verified on-chain");
  }

  const payload = buildVerificationPayloadFromOffer(offer, overrides);
  const chain = await reverifyDispatchTaskOnChain({
    taskId: String(offer._id),
    payload,
  });

  offer.status = "VERIFIED";
  offer.verifiedAt = new Date();
  offer.verifiedBy = new Types.ObjectId(adminUserId);
  (offer as any).proofFileHashes = payload.proofFileHashes;

  const existingBlockchain = ((offer as any).blockchain ?? {}) as any;
  (offer as any).blockchain = {
    network: chain.network,
    contractAddress: chain.contractAddress,
    schemaVersion: payload.schemaVersion,
    domain: payload.domain,
    taskIdHash: chain.taskIdHash,
    payloadHash: chain.payloadHash,
    verifiedTxHash: String(existingBlockchain.verifiedTxHash || (offer as any).chainRecord?.txHash || chain.txHash),
    verifiedAtBlockTime: existingBlockchain.verifiedAtBlockTime ?? toDateFromBlockTimestamp(chain.blockTimestamp),
    verifierAddress: existingBlockchain.verifierAddress || chain.signerAddress || undefined,
    revoked: false,
    reverifiedTxHash: chain.txHash,
  };

  (offer as any).chainRecord = {
    ...(offer as any).chainRecord,
    network: chain.network,
    contractAddress: chain.contractAddress,
    txHash: chain.txHash,
    blockNumber: chain.blockNumber,
    taskIdHash: chain.taskIdHash,
    payloadHash: chain.payloadHash,
    recordHash: chain.payloadHash,
    recordedAt: toDateFromBlockTimestamp(chain.blockTimestamp) ?? new Date(),
    revoked: false,
  };
  await offer.save();

  return {
    txHash: chain.txHash,
    dispatchId: String(offer._id),
    taskIdHash: chain.taskIdHash,
    payloadHash: chain.payloadHash,
    revoked: false,
  };
}

export async function listDispatchTasksForLgu(params: { statuses: DispatchStatus[]; emergencyId?: string }) {
  const statuses = (params.statuses ?? []).filter(Boolean);
  const query: any = {};
  if (statuses.length) query.status = { $in: statuses };
  if (params.emergencyId && Types.ObjectId.isValid(params.emergencyId)) {
    query.emergencyId = new Types.ObjectId(params.emergencyId);
  }

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

  const chainRecordRaw = doc.chainRecord ?? null;
  const blockchainRaw = doc.blockchain ?? null;
  const chainRecord = chainRecordRaw
    ? {
        ...chainRecordRaw,
        recordHash:
          chainRecordRaw.recordHash ??
          chainRecordRaw.payloadHash ??
          blockchainRaw?.payloadHash ??
          null,
      }
    : null;

  const lastKnownLocationRaw = doc.lastKnownLocation;
  const lastKnownCoords = Array.isArray(lastKnownLocationRaw?.coordinates)
    ? lastKnownLocationRaw.coordinates
    : null;
  const lastKnownLocation =
    lastKnownCoords && lastKnownCoords.length === 2
      ? {
          lng: Number(lastKnownCoords[0]),
          lat: Number(lastKnownCoords[1]),
          ...(Number.isFinite(lastKnownLocationRaw?.accuracy)
            ? { accuracy: Number(lastKnownLocationRaw.accuracy) }
            : {}),
          ...(Number.isFinite(lastKnownLocationRaw?.heading)
            ? { heading: Number(lastKnownLocationRaw.heading) }
            : {}),
          ...(Number.isFinite(lastKnownLocationRaw?.speed)
            ? { speed: Number(lastKnownLocationRaw.speed) }
            : {}),
          at: doc.lastKnownLocationAt ?? null,
        }
      : null;

  return {
    id: String(doc._id),
    status: doc.status,
    respondedAt: doc.respondedAt ?? null,
    completedAt: doc.completedAt ?? null,
    verifiedAt: doc.verifiedAt ?? null,
    chainRecord,
    blockchain: blockchainRaw,
    proofs: Array.isArray(doc.proofs) ? doc.proofs : [],
    proofFileHashes: extractProofFileHashes(doc),
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
    lastKnownLocation,
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

export function hashProofFileBytes(buffer: Buffer) {
  const digest = crypto.createHash(PROOF_HASH_ALGO).update(buffer).digest("hex").toLowerCase();
  return `0x${digest}`;
}

function extractProofUrls(offer: any) {
  const values = Array.isArray(offer?.proofs)
    ? offer.proofs.map((p: any) => String(p?.url || ""))
    : [];
  return normalizeStringArray(values);
}

export function extractProofFileHashes(offer: any) {
  const fromTopLevel = normalizeStringArray(
    Array.isArray(offer?.proofFileHashes) ? offer.proofFileHashes.map((value: any) => String(value || "")) : []
  );
  if (fromTopLevel.length > 0) return fromTopLevel;

  const fromProofEntries = normalizeStringArray(
    Array.isArray(offer?.proofs) ? offer.proofs.map((p: any) => String(p?.fileHash || "")) : []
  );
  return fromProofEntries;
}

export function buildVerificationPayloadFromOffer(offer: any, overrides?: DispatchReverifyOverrides) {
  const completedAt =
    overrides && Object.prototype.hasOwnProperty.call(overrides, "completedAt")
      ? normalizeCompletedAt(overrides.completedAt)
      : offer.completedAt
      ? new Date(offer.completedAt).toISOString()
      : null;

  const proofUrls = overrides?.proofUrls ? normalizeStringArray(overrides.proofUrls) : extractProofUrls(offer);
  const proofFileHashes = overrides?.proofFileHashes
    ? normalizeStringArray(overrides.proofFileHashes)
    : extractProofFileHashes(offer);

  return buildDispatchVerificationPayload({
    taskId: String(offer._id),
    dispatchId: String(offer._id),
    emergencyId: String(offer.emergencyId),
    volunteerId: String(offer.volunteerId),
    completedAt,
    proofUrls,
    proofFileHashes,
  });
}

function normalizeCompletedAt(value: string | null | undefined) {
  if (value === null) return null;
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid completedAt");
  }
  return d.toISOString();
}

function toDateFromBlockTimestamp(timestamp: number | null) {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp * 1000);
}

function normalizeHashValue(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isAlreadyVerifiedChainError(error: unknown) {
  const message = String((error as any)?.message ?? "").toLowerCase();
  return message.includes("already_verified") || message.includes("already verified");
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
