import type { DispatchOffer } from "./dispatch";
import { DEFAULT_DISPATCH_INSTRUCTION } from "../constants/dispatchModal.constants";
import { isDispatchOfferEnRoute } from "../utils/dispatchProgress";

export type DispatchModalSeverity = "low" | "medium" | "high" | "critical";
export type DispatchModalStatus = "dispatched" | "accepted" | "declined" | "cancelled";

export type DispatchModalData = {
  assignmentId: string;
  emergencyId: string;
  emergencyType?: string;
  emergencyTitle: string;
  severity?: DispatchModalSeverity;
  status?: DispatchModalStatus;
  isEnRoute?: boolean;
  lguName?: string;
  barangay?: string;
  addressLine?: string;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  reportedAt?: string | null;
  instruction?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function readString(...values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return undefined;
}

function readNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSeverity(raw: unknown, emergencyType: string): DispatchModalSeverity {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (normalized === "low") return "low";
  if (normalized === "medium") return "medium";
  if (normalized === "high") return "high";
  if (normalized === "critical") return "critical";

  const type = emergencyType.toUpperCase();
  if (type.includes("SOS")) return "critical";
  if (type.includes("FLOOD") || type.includes("FIRE") || type.includes("RESCUE")) return "high";
  return "high";
}

function mapStatus(raw: DispatchOffer["status"]): DispatchModalStatus {
  if (raw === "ACCEPTED") return "accepted";
  if (raw === "DECLINED") return "declined";
  if (raw === "CANCELLED") return "cancelled";
  return "dispatched";
}

export function toDispatchModalData(offer: DispatchOffer | null): DispatchModalData | null {
  if (!offer) return null;
  if (!offer.id) return null;

  const offerRecord = asRecord(offer);
  const emergencyRecord = asRecord(offerRecord.emergency);

  const emergencyType = readString(emergencyRecord.emergencyType) ?? "Emergency";
  const formattedType = titleCase(emergencyType);
  const emergencyTitle =
    readString(
      emergencyRecord.title,
      emergencyRecord.emergencyTitle,
      emergencyRecord.headline,
      offerRecord.emergencyTitle
    ) ?? `${formattedType} Assistance`;

  const barangay = readString(emergencyRecord.barangayName);
  const lat = readNumber(emergencyRecord.lat);
  const lng = readNumber(emergencyRecord.lng);
  const coordinatesLabel =
    typeof lat === "number" && typeof lng === "number"
      ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      : undefined;

  const addressLine =
    readString(
      emergencyRecord.addressLine,
      emergencyRecord.address,
      emergencyRecord.locationLabel,
      emergencyRecord.formattedAddress
    ) ??
    (barangay ? `Brgy. ${barangay}` : undefined) ??
    coordinatesLabel;

  return {
    assignmentId: offer.id,
    emergencyId: readString(emergencyRecord.id) ?? "",
    emergencyType: emergencyType,
    emergencyTitle,
    severity: normalizeSeverity(emergencyRecord.severity, emergencyType),
    status: mapStatus(offer.status),
    isEnRoute: isDispatchOfferEnRoute(offer),
    lguName: readString(
      offerRecord.lguName,
      offerRecord.assignedByName,
      offerRecord.assignedBy,
      emergencyRecord.lguName
    ),
    barangay,
    addressLine,
    distanceKm:
      readNumber(
        emergencyRecord.distanceKm,
        emergencyRecord.distance,
        emergencyRecord.distance_km,
        offerRecord.distanceKm
      ) ?? null,
    etaMinutes:
      readNumber(
        emergencyRecord.etaMinutes,
        emergencyRecord.etaMin,
        emergencyRecord.eta_minutes,
        offerRecord.etaMinutes
      ) ?? null,
    reportedAt:
      readString(
        emergencyRecord.reportedAt,
        emergencyRecord.createdAt,
        offerRecord.reportedAt,
        offerRecord.createdAt
      ) ?? null,
    instruction:
      readString(offerRecord.instruction, emergencyRecord.instruction) ?? DEFAULT_DISPATCH_INSTRUCTION,
  };
}
