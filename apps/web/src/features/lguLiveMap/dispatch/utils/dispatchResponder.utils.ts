import { emergencyTitleForType } from "../../../emergency/constants/emergency.constants";
import type { LguEmergencyDetails, Volunteer } from "../../models/lguLiveMap.types";
import { EMERGENCY_TRAINING_CONFIG } from "../constants/dispatchResponders.constants";
import type {
  DispatchableResponder,
  DispatchEmergencyContext,
  RecommendationLabel,
} from "../types/dispatchResponders.types";
import type { ResponderDispatchState } from "./dispatchLifecycle.utils";

export function splitResponderSkills(value?: string | null) {
  const skills = String(value ?? "")
    .split(/[,;|]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  return Array.from(new Set(skills));
}

export function responderInitials(name?: string | null) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`.toUpperCase();
}

export function distanceInKm(fromLat: number, fromLng: number, toLat?: number, toLng?: number) {
  if (!Number.isFinite(toLat) || !Number.isFinite(toLng)) return null;
  const radiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(Number(toLat) - fromLat);
  const longitudeDelta = radians(Number(toLng) - fromLng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(fromLat)) * Math.cos(radians(Number(toLat))) * Math.sin(longitudeDelta / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestAvailableResponderIds(
  volunteers: Volunteer[],
  emergency: Pick<LguEmergencyDetails, "lng" | "lat">,
  assignedIds: ReadonlySet<string>,
  limit = 2,
) {
  const available = volunteers.filter(
    (volunteer) => volunteer.status === "available" && !assignedIds.has(volunteer.id),
  );
  const withCoords = available.filter(
    (volunteer) => Number.isFinite(volunteer.lng) && Number.isFinite(volunteer.lat),
  );

  if (withCoords.length > 0) {
    return [...withCoords]
      .sort((a, b) => {
        const distanceA =
          (Number(a.lng) - emergency.lng) ** 2 + (Number(a.lat) - emergency.lat) ** 2;
        const distanceB =
          (Number(b.lng) - emergency.lng) ** 2 + (Number(b.lat) - emergency.lat) ** 2;
        return distanceA - distanceB;
      })
      .slice(0, limit)
      .map((volunteer) => volunteer.id);
  }

  return available.slice(0, limit).map((volunteer) => volunteer.id);
}

export function toDispatchEmergencyContext(emergency: LguEmergencyDetails): DispatchEmergencyContext {
  const status = String(emergency.status ?? "").toUpperCase();
  const dispatchable = !["RESOLVED", "CANCELLED", "COMPLETED", "DONE", "VERIFIED"].includes(status);
  const barangay = String(emergency.barangayName ?? "").trim();
  return {
    id: emergency.id,
    referenceNumber: String(emergency.referenceNumber ?? emergency.id),
    emergencyType: emergency.emergencyType,
    title: emergencyTitleForType(emergency.emergencyType),
    location: String(emergency.locationLabel ?? "").trim() || (barangay ? `Barangay ${barangay}` : "Location unavailable"),
    lng: emergency.lng,
    lat: emergency.lat,
    dispatchable,
  };
}

export function normalizeDispatchResponder(
  volunteer: Volunteer,
  emergency: DispatchEmergencyContext,
  dispatchStates: ReadonlyMap<string, ResponderDispatchState>,
): DispatchableResponder {
  const skills = splitResponderSkills(volunteer.skill);
  const normalizedSkills = skills.map((skill) => skill.toLowerCase());
  const trainingTerms = EMERGENCY_TRAINING_CONFIG[emergency.emergencyType].terms;
  const matchesEmergencyTraining = trainingTerms.some((term) =>
    normalizedSkills.some((skill) => skill.includes(term) || term.includes(skill)),
  );
  const dispatchState = dispatchStates.get(volunteer.id) ?? "available";
  const isAssigned = dispatchState === "assigned";
  const isAwaitingResponse = dispatchState === "awaiting_response";
  const availability = volunteer.status;
  const rating = Number.isFinite(volunteer.rating) ? Number(volunteer.rating) : null;
  const reviewCount = Number.isFinite(volunteer.reviewCount) ? Math.max(0, Number(volunteer.reviewCount)) : null;
  const etaMinutes = Number.isFinite(volunteer.etaMinutes) ? Math.max(0, Number(volunteer.etaMinutes)) : null;

  return {
    ...volunteer,
    skills: skills.length > 0 ? skills : ["General Responder"],
    availability,
    distanceKm: distanceInKm(emergency.lat, emergency.lng, volunteer.lat, volunteer.lng),
    etaMinutes,
    rating,
    reviewCount,
    dispatchState,
    isAssigned,
    isAwaitingResponse,
    isDispatchable:
      emergency.dispatchable &&
      availability === "available" &&
      dispatchState === "available",
    matchesEmergencyTraining,
  };
}

export function responderBestMatchValue(responder: DispatchableResponder) {
  const availabilityRank = responder.isDispatchable ? 4 : responder.availability === "available" ? 3 : responder.availability === "busy" ? 2 : 1;
  const skillRank = responder.matchesEmergencyTraining ? 1 : 0;
  const backendRank = Number.isFinite(responder.recommendationScore) ? Number(responder.recommendationScore) : 0;
  const proximityRank = responder.distanceKm === null ? 0 : Math.max(0, 100 - responder.distanceKm);
  return availabilityRank * 10_000 + skillRank * 1_000 + backendRank * 10 + proximityRank;
}

export function recommendationLabelFor(
  responder: DispatchableResponder,
  rankedIndex: number,
): RecommendationLabel | null {
  if (rankedIndex === 0 && responder.isDispatchable && (responder.matchesEmergencyTraining || responder.distanceKm !== null)) {
    return "Best Match";
  }
  if (responder.matchesEmergencyTraining) return "Skill Match";
  if (responder.distanceKm !== null && responder.distanceKm <= 5) return "Nearby";
  return null;
}
