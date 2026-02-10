import { Types } from "mongoose";
import { DispatchOffer, type DispatchStatus } from "./dispatch.model";
import { EmergencyReport } from "../emergency/emergency.model";

export type DispatchEmergencySummary = {
  id: string;
  emergencyType: string;
  status: string;
  source?: string;
  lng: number;
  lat: number;
  notes?: string;
  reportedAt: string;
};

export type DispatchOfferDTO = {
  id: string;
  status: DispatchStatus;
  dispatchedAt: string;
  respondedAt?: string;
  emergency: DispatchEmergencySummary;
};

function toEmergencySummary(emergency: any): DispatchEmergencySummary {
  const coords = emergency?.location?.coordinates ?? [0, 0];
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);

  return {
    id: String(emergency._id),
    emergencyType: String(emergency.emergencyType ?? "SOS"),
    status: String(emergency.status ?? "OPEN"),
    source: emergency.source ? String(emergency.source) : undefined,
    lng,
    lat,
    notes: emergency.notes ? String(emergency.notes) : undefined,
    reportedAt: new Date(emergency.reportedAt ?? emergency.createdAt ?? Date.now()).toISOString(),
  };
}

function toOfferDTO(offer: any, emergency: any): DispatchOfferDTO {
  return {
    id: String(offer._id),
    status: offer.status as DispatchStatus,
    dispatchedAt: new Date(offer.dispatchedAt ?? offer.createdAt ?? Date.now()).toISOString(),
    respondedAt: offer.respondedAt ? new Date(offer.respondedAt).toISOString() : undefined,
    emergency: toEmergencySummary(emergency),
  };
}

export async function createDispatchOffers(params: {
  emergencyId: string;
  volunteerIds: string[];
  dispatchedById: string;
}): Promise<{ created: number; skipped: number; offerIds: string[] }> {
  const { emergencyId, volunteerIds, dispatchedById } = params;

  if (!Types.ObjectId.isValid(emergencyId)) throw new Error("Invalid emergencyId");
  const emergency = await EmergencyReport.findById(emergencyId).lean();
  if (!emergency) throw new Error("Emergency not found");

  const uniqueVolunteerIds = Array.from(new Set(volunteerIds)).filter((id) => Types.ObjectId.isValid(id));
  let created = 0;
  let skipped = 0;
  const offerIds: string[] = [];

  for (const vid of uniqueVolunteerIds) {
    try {
      const offer = await DispatchOffer.create({
        emergencyId: new Types.ObjectId(emergencyId),
        volunteerId: new Types.ObjectId(vid),
        dispatchedBy: new Types.ObjectId(dispatchedById),
        status: "PENDING",
        dispatchedAt: new Date(),
      });
      created += 1;
      offerIds.push(String(offer._id));
    } catch (e: any) {
      // Duplicate pending offer (unique partial index) -> skip
      if (String(e?.code) === "11000") {
        skipped += 1;
        continue;
      }
      throw e;
    }
  }

  return { created, skipped, offerIds };
}

export async function getLatestPendingOfferForVolunteer(volunteerId: string): Promise<DispatchOfferDTO | null> {
  if (!Types.ObjectId.isValid(volunteerId)) return null;

  const offer = await DispatchOffer.findOne({
    volunteerId: new Types.ObjectId(volunteerId),
    status: "PENDING",
  })
    .sort({ dispatchedAt: -1 })
    .lean();

  if (!offer) return null;

  const emergency = await EmergencyReport.findById(offer.emergencyId).lean();
  if (!emergency) return null;

  return toOfferDTO(offer, emergency);
}

export async function respondToOffer(params: {
  offerId: string;
  volunteerId: string;
  decision: "ACCEPT" | "DECLINE";
}): Promise<DispatchOfferDTO> {
  const { offerId, volunteerId, decision } = params;
  if (!Types.ObjectId.isValid(offerId)) throw new Error("Invalid offer id");

  const nextStatus: DispatchStatus = decision === "ACCEPT" ? "ACCEPTED" : "DECLINED";

  const offer = await DispatchOffer.findOneAndUpdate(
    {
      _id: new Types.ObjectId(offerId),
      volunteerId: new Types.ObjectId(volunteerId),
      status: "PENDING",
    },
    { $set: { status: nextStatus, respondedAt: new Date() } },
    { new: true }
  ).lean();

  if (!offer) throw new Error("Offer not found or already responded");

  const emergency = await EmergencyReport.findById(offer.emergencyId).lean();
  if (!emergency) throw new Error("Emergency not found");

  return toOfferDTO(offer, emergency);
}
