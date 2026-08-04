import { emergencyTitleForType } from "../../../emergency/constants/emergency.constants";
import type { DispatchTask } from "../../../tasks/models/tasks.types";
import type { LguEmergencyDetails, Volunteer } from "../../models/lguLiveMap.types";
import { EMERGENCY_TRAINING_CONFIG } from "../constants/dispatchResponders.constants";
import type {
  DispatchableResponder,
  DispatchEmergencyContext,
  RecommendationLabel,
} from "../types/dispatchResponders.types";

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

export function activeAssignedResponderIds(tasks: DispatchTask[]) {
  return new Set(
    tasks
      .filter((task) => !["DECLINED", "CANCELLED", "VERIFIED"].includes(String(task.status ?? "").toUpperCase()))
      .map((task) => String(task.volunteer?.id ?? "").trim())
      .filter(Boolean),
  );
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
  assignedIds: ReadonlySet<string>,
): DispatchableResponder {
  const skills = splitResponderSkills(volunteer.skill);
  const normalizedSkills = skills.map((skill) => skill.toLowerCase());
  const trainingTerms = EMERGENCY_TRAINING_CONFIG[emergency.emergencyType].terms;
  const matchesEmergencyTraining = trainingTerms.some((term) =>
    normalizedSkills.some((skill) => skill.includes(term) || term.includes(skill)),
  );
  const isAssigned = assignedIds.has(volunteer.id);
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
    isAssigned,
    isDispatchable: emergency.dispatchable && availability === "available" && !isAssigned,
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
