import { api } from "../../../lib/api";
import type { MapEmergencyReport, SosCreateRequest } from "../models/emergency.types";
import type { EmergencyType, ReportLocation, ReportSubmitResult } from "../../report/models/report.types";

const EMERGENCY_REPORTS_BASE = "/api/emergency/reports";

export async function createSosReport(payload: SosCreateRequest): Promise<ReportSubmitResult> {
  const locationLabel = String(payload.locationLabel ?? "").trim();

  const res = await api.post(EMERGENCY_REPORTS_BASE, {
    isSos: true,
    type: "other",
    location: {
      coords: {
        latitude: payload.lat,
        longitude: payload.lng,
      },
      ...(locationLabel ? { label: locationLabel.slice(0, 160) } : {}),
    },
    description: payload.notes,
  });

  const data = res.data as ReportSubmitResult | undefined;
  if (!data?.incidentId || !data.referenceNumber) {
    throw new Error("Invalid SOS response");
  }

  return data;
}

type CreateEmergencyReportPayload = {
  type: EmergencyType;
  location: ReportLocation;
  description?: string;
  photos?: string[];
};

type UploadEmergencyReportPhotoPayload = {
  base64: string;
  mimeType?: string;
  fileName?: string;
};

export async function createEmergencyReport(
  payload: CreateEmergencyReportPayload
): Promise<ReportSubmitResult> {
  const res = await api.post(EMERGENCY_REPORTS_BASE, {
    ...payload,
    isSos: false,
  });
  const data = res.data as ReportSubmitResult | undefined;
  if (!data?.incidentId || !data.referenceNumber) {
    throw new Error("Invalid emergency report response");
  }

  return data;
}

export async function uploadEmergencyReportPhoto(
  payload: UploadEmergencyReportPhotoPayload
): Promise<{ url: string }> {
  const res = await api.post<{ url?: string }>(`${EMERGENCY_REPORTS_BASE}/photos`, payload);
  const url = String(res.data?.url ?? "").trim();
  if (!url) {
    throw new Error("Invalid photo upload response");
  }

  return { url };
}

export async function fetchEmergencyMapReports(): Promise<MapEmergencyReport[]> {
  return fetchEmergencyMapReportsWithOptions();
}

type FetchEmergencyMapReportsOptions = {
  includeUnapproved?: boolean;
  limit?: number;
};

type LegacyEmergencyReport = {
  _id?: string;
  referenceNumber?: string;
  emergencyType?: string;
  source?: string;
  isSos?: boolean;
  verification?: {
    status?: "not_required" | "pending" | "approved" | "rejected";
  };
  visibility?: {
    isVisibleOnMap?: boolean;
  };
  location?: {
    coordinates?: [number, number];
  };
  locationLabel?: string;
  notes?: string;
  reportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapLegacyReportToMapFeed(raw: LegacyEmergencyReport): MapEmergencyReport | null {
  const incidentId = String(raw._id ?? "").trim();
  if (!incidentId) return null;

  const lng = Number(raw.location?.coordinates?.[0]);
  const lat = Number(raw.location?.coordinates?.[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const type = String(raw.emergencyType ?? "OTHER").trim().toLowerCase();
  const source = String(raw.source ?? "").trim().toUpperCase();
  const isSos = Boolean(raw.isSos) || type === "sos" || source === "SOS_BUTTON";

  const verification = String(raw.verification?.status ?? "").trim().toLowerCase();
  const verificationStatus: MapEmergencyReport["verificationStatus"] =
    verification === "approved" || verification === "pending" || verification === "rejected"
      ? verification
      : isSos
        ? "not_required"
        : "pending";

  const isVisibleOnMap =
    typeof raw.visibility?.isVisibleOnMap === "boolean"
      ? raw.visibility.isVisibleOnMap
      : isSos || verificationStatus === "approved";

  return {
    incidentId,
    referenceNumber: String(raw.referenceNumber ?? "").trim(),
    isSos,
    type,
    verificationStatus,
    isVisibleOnMap,
    createdAt: String(raw.reportedAt ?? raw.createdAt ?? raw.updatedAt ?? new Date().toISOString()),
    location: {
      coords: {
        latitude: lat,
        longitude: lng,
      },
      label: raw.locationLabel,
    },
    description: raw.notes,
  };
}

export async function fetchEmergencyMapReportsWithOptions(
  options?: FetchEmergencyMapReportsOptions
): Promise<MapEmergencyReport[]> {
  if (options?.includeUnapproved) {
    try {
      const limit = Number.isFinite(options.limit) ? Number(options.limit) : 300;
      const res = await api.get<{ data?: LegacyEmergencyReport[] }>("/api/emergencies/reports", {
        params: { limit },
      });
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      return rows
        .map(mapLegacyReportToMapFeed)
        .filter((item): item is MapEmergencyReport => Boolean(item));
    } catch (error: any) {
      const status = Number(error?.response?.status ?? 0);
      if (status !== 401 && status !== 403) {
        throw error;
      }
      // LGU/Admin-only endpoint may reject other roles; fallback to public map feed below.
    }
  }

  const res = await api.get<{ data?: MapEmergencyReport[] }>(`${EMERGENCY_REPORTS_BASE}/map`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
