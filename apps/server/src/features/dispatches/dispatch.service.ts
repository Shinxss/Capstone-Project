import { Types } from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { encryptBuffer } from "../../utils/aesGcm";

import { EmergencyReport } from "../emergency/emergency.model";
import { User } from "../users/user.model";
import { DispatchOffer, DispatchStatus } from "./dispatch.model";

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

  const snapshot = {
    id: String(emergency._id),
    emergencyType: emergency.emergencyType,
    source: emergency.source,
    status: emergency.status,
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

  const docs = validVolunteerIds.map((volunteerId) => ({
    emergencyId: new Types.ObjectId(emergencyId),
    volunteerId: new Types.ObjectId(volunteerId),
    createdBy,
    status: "PENDING" as DispatchStatus,
    emergencySnapshot: snapshot,
  }));

  const created = await DispatchOffer.insertMany(docs);
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

  const clean = String(base64 || "").replace(/^data:.*;base64,/, "").trim();
  if (!clean) throw new Error("base64 is required");

  const ext = guessExt(mimeType, fileName);
  const dir = ensureUploadsDir();
  const filename = `${dispatchId}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const abs = path.join(dir, filename);

  const buf = Buffer.from(clean, "base64");
  // Encrypt before writing to disk (encryption-at-rest)
  const encrypted = encryptBuffer(buf);
  fs.writeFileSync(abs, encrypted);

  const url = `/uploads/dispatch-proofs/${filename}`;
  (offer.proofs as any) = Array.isArray(offer.proofs) ? offer.proofs : [];
  offer.proofs.push({ url, uploadedAt: new Date(), mimeType, fileName } as any);
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

export async function verifyDispatch(params: { dispatchId: string; verifierUserId: string }) {
  const { dispatchId, verifierUserId } = params;

  if (!Types.ObjectId.isValid(dispatchId)) {
    throw new Error("Invalid dispatch id");
  }

  const offer = await DispatchOffer.findById(dispatchId);
  if (!offer) throw new Error("Dispatch offer not found");

  if (offer.status !== "DONE") {
    throw new Error("Only DONE tasks can be verified");
  }

  offer.status = "VERIFIED";
  offer.verifiedAt = new Date();
  offer.verifiedBy = new Types.ObjectId(verifierUserId);
  await offer.save();

  // Optional: mark emergency resolved when at least one task is verified
  try {
    await EmergencyReport.updateOne({ _id: offer.emergencyId }, { $set: { status: "RESOLVED" } });
  } catch {
    // ignore
  }

  return offer;
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

function guessExt(mimeType?: string, fileName?: string) {
  const name = (fileName || "").toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".heic")) return "heic";

  const mt = (mimeType || "").toLowerCase();
  if (mt.includes("png")) return "png";
  if (mt.includes("jpeg") || mt.includes("jpg")) return "jpg";
  if (mt.includes("heic")) return "heic";

  return "bin";
}
