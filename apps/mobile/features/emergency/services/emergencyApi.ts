import { api } from "../../../lib/api";
import type {
  EmergencyReportDetail,
  MapEmergencyReport,
  SosCreateRequest,
} from "../models/emergency.types";
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

export async function fetchMyEmergencyMapReports(): Promise<MapEmergencyReport[]> {
  const res = await api.get<{ data?: MapEmergencyReport[] }>(`${EMERGENCY_REPORTS_BASE}/my/map`);
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];
  return normalizeMapRows(rows);
}

type FetchEmergencyMapReportsOptions = {
  includeUnapproved?: boolean;
  limit?: number;
};

type LegacyEmergencyReport = {
  _id?: string;
  referenceNumber?: string;
  emergencyType?: string;
  status?: string;
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

function toMapStatus(raw?: string): MapEmergencyReport["status"] {
  const normalized = String(raw ?? "").trim().toUpperCase();
  if (normalized === "ACKNOWLEDGED") return "assigned";
  if (normalized === "IN_PROGRESS") return "in_progress";
  if (normalized === "RESOLVED") return "resolved";
  if (normalized === "CANCELLED") return "cancelled";
  return "open";
}

function isClosedEmergencyStatus(raw?: string) {
  const normalized = String(raw ?? "").trim().toUpperCase();
  return normalized === "RESOLVED" || normalized === "CANCELLED";
}

function isClosedMapFeedStatus(raw?: string) {
  const normalized = String(raw ?? "").trim().toLowerCase();
  return normalized === "resolved" || normalized === "cancelled";
}

function normalizeMapRows(rows: MapEmergencyReport[]) {
  const byId = new Map<string, MapEmergencyReport>();

  rows.forEach((item) => {
    const incidentId = String(item?.incidentId ?? "").trim();
    if (!incidentId) return;
    if (isClosedMapFeedStatus(item?.status)) return;

    const lng = Number(item?.location?.coords?.longitude);
    const lat = Number(item?.location?.coords?.latitude);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const current = byId.get(incidentId);
    if (!current) {
      byId.set(incidentId, item);
      return;
    }

    const currentTs = new Date(String(current.createdAt ?? "")).getTime();
    const nextTs = new Date(String(item.createdAt ?? "")).getTime();
    if (nextTs > currentTs) {
      byId.set(incidentId, item);
    }
  });

  return [...byId.values()].sort((a, b) => {
    const ta = new Date(String(a.createdAt ?? "")).getTime();
    const tb = new Date(String(b.createdAt ?? "")).getTime();
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
}

function mapLegacyReportToMapFeed(raw: LegacyEmergencyReport): MapEmergencyReport | null {
  const incidentId = String(raw._id ?? "").trim();
  if (!incidentId) return null;
  if (isClosedEmergencyStatus(raw.status)) return null;

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
    status: toMapStatus(raw.status),
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
  const limit = Number.isFinite(options?.limit) ? Number(options?.limit) : 300;

  const loadMapFeed = async () => {
    const res = await api.get<{ data?: MapEmergencyReport[] }>(`${EMERGENCY_REPORTS_BASE}/map`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  };

  if (!options?.includeUnapproved) {
    return normalizeMapRows(await loadMapFeed());
  }

  const loadLegacyFeed = async () => {
    const res = await api.get<{ data?: LegacyEmergencyReport[] }>("/api/emergencies/reports", {
      params: { limit },
    });
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return rows
      .map(mapLegacyReportToMapFeed)
      .filter((item): item is MapEmergencyReport => Boolean(item));
  };

  const [mapResult, legacyResult] = await Promise.allSettled([loadMapFeed(), loadLegacyFeed()]);
  const merged: MapEmergencyReport[] = [];

  if (mapResult.status === "fulfilled") {
    merged.push(...mapResult.value);
  }
  if (legacyResult.status === "fulfilled") {
    merged.push(...legacyResult.value);
  } else {
    const legacyStatus = Number((legacyResult.reason as any)?.response?.status ?? 0);
    const isAuthDenied = legacyStatus === 401 || legacyStatus === 403;
    if (!isAuthDenied && mapResult.status === "rejected") {
      throw legacyResult.reason;
    }
  }

  if (!merged.length && mapResult.status === "rejected") {
    throw mapResult.reason;
  }

  return normalizeMapRows(merged);
}

export async function fetchEmergencyReportDetail(id: string): Promise<EmergencyReportDetail> {
  const reportId = String(id ?? "").trim();
  if (!reportId) {
    throw new Error("Emergency id is required.");
  }
  const res = await api.get<EmergencyReportDetail>(`${EMERGENCY_REPORTS_BASE}/${reportId}`);
  return res.data;
}
