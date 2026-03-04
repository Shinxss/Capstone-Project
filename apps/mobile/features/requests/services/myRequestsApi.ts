import axios from "axios";
import { api } from "../../../lib/api";
import type {
  MyRequestCountsByStatus,
  MyRequestStatusTab,
  MyRequestScope,
  MyRequestSummary,
  MyRequestTrackingDTO,
  TrackingLabel,
} from "../models/myRequests";
import { normalizeMyRequestStatusTab } from "../models/myRequests";

const MY_REQUESTS_BASE = "/api/emergency/reports";

function normalizeTrackingLabel(raw: unknown): TrackingLabel {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (normalized === "submitted") return "Submitted";
  if (normalized === "verification") return "Verification";
  if (normalized === "assigned") return "Assigned";
  if (normalized === "en route") return "En Route";
  if (normalized === "arrived") return "Arrived";
  if (normalized === "review") return "Review";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "cancelled") return "Cancelled";
  return "Submitted";
}

function normalizeLocation(raw: any) {
  const directLng = Number(raw?.location?.lng ?? raw?.location?.longitude);
  const directLat = Number(raw?.location?.lat ?? raw?.location?.latitude);
  if (Number.isFinite(directLng) && Number.isFinite(directLat)) {
    return { lng: directLng, lat: directLat };
  }

  if (Array.isArray(raw?.location?.coordinates) && raw.location.coordinates.length >= 2) {
    const lng = Number(raw.location.coordinates[0]);
    const lat = Number(raw.location.coordinates[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return { lng, lat };
    }
  }

  return { lng: 0, lat: 0 };
}

function normalizeLocationText(raw: any, location: { lng: number; lat: number }) {
  const value = String(raw?.locationText ?? "").trim();
  if (value) return value;
  if (!Number.isFinite(location.lng) || !Number.isFinite(location.lat)) return "Location unavailable";
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

function normalizeSummary(raw: any): MyRequestSummary {
  const location = normalizeLocation(raw);
  const trackingLabel = normalizeTrackingLabel(raw?.trackingLabel ?? raw?.trackingStatus);
  const etaValue = Number(raw?.etaSeconds);
  const etaSeconds = Number.isFinite(etaValue) ? Math.max(0, Math.round(etaValue)) : null;

  return {
    id: String(raw?.id ?? ""),
    referenceNumber: String(raw?.referenceNumber ?? ""),
    type: String(raw?.type ?? "other"),
    trackingLabel,
    trackingStatus: trackingLabel,
    status: String(raw?.status ?? "OPEN"),
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    location,
    locationText: normalizeLocationText(raw, location),
    etaSeconds,
    lastUpdatedAt:
      raw?.lastUpdatedAt === null || raw?.lastUpdatedAt === undefined
        ? null
        : String(raw?.lastUpdatedAt),
  };
}

function normalizeCounts(raw: any): MyRequestCountsByStatus {
  const assigned = Number(raw?.assigned);
  const enRoute = Number(raw?.en_route);
  const arrived = Number(raw?.arrived);
  const resolved = Number(raw?.resolved);

  return {
    assigned: Number.isFinite(assigned) ? Math.max(0, Math.round(assigned)) : 0,
    en_route: Number.isFinite(enRoute) ? Math.max(0, Math.round(enRoute)) : 0,
    arrived: Number.isFinite(arrived) ? Math.max(0, Math.round(arrived)) : 0,
    resolved: Number.isFinite(resolved) ? Math.max(0, Math.round(resolved)) : 0,
  };
}

export async function getCountsByStatus(): Promise<MyRequestCountsByStatus> {
  const res = await api.get<MyRequestCountsByStatus>(`${MY_REQUESTS_BASE}/my/counts`);
  return normalizeCounts(res.data);
}

export async function getMyRequests(params: { tab: MyRequestStatusTab }): Promise<MyRequestSummary[]> {
  const tab = normalizeMyRequestStatusTab(params.tab, "all");
  const res = await api.get<MyRequestSummary[]>(`${MY_REQUESTS_BASE}/my`, {
    params: { tab },
  });
  if (!Array.isArray(res.data)) return [];
  return res.data.map(normalizeSummary);
}

export async function fetchMyActiveRequest(): Promise<MyRequestSummary | null> {
  try {
    const res = await api.get<MyRequestSummary>(`${MY_REQUESTS_BASE}/my/active`);
    return normalizeSummary(res.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function fetchMyRequests(scope: MyRequestScope = "active"): Promise<MyRequestSummary[]> {
  const res = await api.get<MyRequestSummary[]>(`${MY_REQUESTS_BASE}/my`, {
    params: { scope },
  });
  if (!Array.isArray(res.data)) return [];
  return res.data.map(normalizeSummary);
}

export async function fetchMyRequestTracking(id: string): Promise<MyRequestTrackingDTO> {
  const requestId = String(id ?? "").trim();
  if (!requestId) throw new Error("Request id is required");

  const res = await api.get<MyRequestTrackingDTO>(`${MY_REQUESTS_BASE}/my/${requestId}/tracking`);
  return res.data;
}
