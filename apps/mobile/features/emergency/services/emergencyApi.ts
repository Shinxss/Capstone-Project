import { api } from "../../../lib/api";
import type { MapEmergencyReport, SosCreateRequest } from "../models/emergency.types";
import type { EmergencyType, ReportLocation, ReportSubmitResult } from "../../report/models/report.types";

const EMERGENCY_REPORTS_BASE = "/api/emergency/reports";

export async function createSosReport(payload: SosCreateRequest): Promise<ReportSubmitResult> {
  const res = await api.post(EMERGENCY_REPORTS_BASE, {
    isSos: true,
    type: "other",
    location: {
      coords: {
        latitude: payload.lat,
        longitude: payload.lng,
      },
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

export async function fetchEmergencyMapReports(): Promise<MapEmergencyReport[]> {
  const res = await api.get<{ data?: MapEmergencyReport[] }>(`${EMERGENCY_REPORTS_BASE}/map`);
  return Array.isArray(res.data?.data) ? res.data!.data! : [];
}
