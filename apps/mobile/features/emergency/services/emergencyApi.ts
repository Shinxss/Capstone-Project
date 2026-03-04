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
  const res = await api.get<{ data?: MapEmergencyReport[] }>(`${EMERGENCY_REPORTS_BASE}/map`);
  return Array.isArray(res.data?.data) ? res.data!.data! : [];
}
