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
import { normalizeMyRequestStatusTab, toMyRequestStatusTabFromLabel } from "../models/myRequests";

const MY_REQUESTS_BASE = "/api/emergency/reports";

function unwrapData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const data = (payload as any).data;
  return data === undefined ? payload : data;
}

function extractRows(payload: unknown): any[] {
  const unwrapped = unwrapData(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (!unwrapped || typeof unwrapped !== "object") return [];

  const record = unwrapped as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.rows)) return record.rows;
  return [];
}

function toNormalizedText(raw: unknown) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeTrackingLabel(raw: unknown): TrackingLabel {
  const normalized = toNormalizedText(raw);
  if (normalized === "submitted" || normalized === "open") return "Submitted";
  if (normalized === "verification" || normalized === "verifying") return "Verification";
  if (normalized === "assigned" || normalized === "acknowledged") return "Assigned";
  if (normalized === "en route" || normalized === "in progress" || normalized === "responding") {
    return "En Route";
  }
  if (normalized === "arrived" || normalized === "on site" || normalized === "onsite") {
    return "Arrived";
  }
  if (normalized === "review" || normalized === "for review") return "Review";
  if (
    normalized === "resolved" ||
    normalized === "done" ||
    normalized === "verified" ||
    normalized === "completed" ||
    normalized === "closed"
  ) {
    return "Resolved";
  }
  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "rejected" ||
    normalized === "declined"
  ) {
    return "Cancelled";
  }
  return "Submitted";
}

function isCancelledLike(raw: unknown): boolean {
  const normalized = toNormalizedText(raw);
  return normalized === "cancelled" || normalized === "canceled" || normalized === "rejected";
}

function isCancelledLikeSummary(raw: any): boolean {
  return (
    isCancelledLike(raw?.trackingLabel) ||
    isCancelledLike(raw?.trackingStatus) ||
    isCancelledLike(raw?.status)
  );
}

function normalizeLocation(raw: any) {
  const directLng = Number(raw?.location?.lng ?? raw?.location?.longitude);
  const directLat = Number(raw?.location?.lat ?? raw?.location?.latitude);
  if (Number.isFinite(directLng) && Number.isFinite(directLat)) {
    return { lng: directLng, lat: directLat };
  }

  const coordsLng = Number(raw?.location?.coords?.lng ?? raw?.location?.coords?.longitude);
  const coordsLat = Number(raw?.location?.coords?.lat ?? raw?.location?.coords?.latitude);
  if (Number.isFinite(coordsLng) && Number.isFinite(coordsLat)) {
    return { lng: coordsLng, lat: coordsLat };
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
  const value = String(raw?.locationText ?? raw?.locationLabel ?? raw?.location?.label ?? "").trim();
  if (value) return value;
  if (!Number.isFinite(location.lng) || !Number.isFinite(location.lat)) return "Location unavailable";
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

function pickFirstText(values: unknown[]): string {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function normalizeSummary(raw: any): MyRequestSummary {
  const location = normalizeLocation(raw);
  const trackingLabel = normalizeTrackingLabel(
    raw?.trackingLabel ?? raw?.trackingStatus ?? raw?.statusLabel ?? raw?.status
  );
  const etaValue = Number(raw?.etaSeconds);
  const etaSeconds = Number.isFinite(etaValue) ? Math.max(0, Math.round(etaValue)) : null;
  const rejectionReason = String(raw?.rejectionReason ?? raw?.verification?.reason ?? "").trim();
  const status = pickFirstText([raw?.status, raw?.emergencyStatus, "OPEN"]) || "OPEN";
  const createdAt =
    pickFirstText([raw?.createdAt, raw?.reportedAt, raw?.updatedAt, new Date().toISOString()]) ||
    new Date().toISOString();
  const id =
    pickFirstText([raw?.id, raw?._id, raw?.incidentId, raw?.requestId, raw?.referenceNumber]) || "";
  const type = pickFirstText([raw?.type, raw?.emergencyType, "other"]) || "other";
  const referenceNumber = pickFirstText([raw?.referenceNumber, raw?.refNo, raw?.referenceNo]);

  return {
    id,
    referenceNumber,
    type,
    trackingLabel,
    trackingStatus: trackingLabel,
    status,
    createdAt,
    location,
    locationText: normalizeLocationText(raw, location),
    ...(rejectionReason ? { rejectionReason } : {}),
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

function isHistoryTab(tab: MyRequestStatusTab) {
  return tab === "resolved" || tab === "review" || tab === "cancelled";
}

function applyTabFilter(items: MyRequestSummary[], tab: MyRequestStatusTab): MyRequestSummary[] {
  if (tab === "all") return items;

  if (tab === "cancelled") {
    return items.filter((item) => isCancelledLikeSummary(item));
  }

  if (tab === "review") {
    return items.filter((item) => toMyRequestStatusTabFromLabel(item.trackingLabel) === "review");
  }

  return items.filter((item) => toMyRequestStatusTabFromLabel(item.trackingLabel) === tab);
}

function summaryKey(item: MyRequestSummary) {
  const id = String(item.id ?? "").trim();
  if (id) return `id:${id}`;

  const referenceNumber = String(item.referenceNumber ?? "").trim();
  const createdAt = String(item.createdAt ?? "").trim();
  return `ref:${referenceNumber}|at:${createdAt}`;
}

function dedupeSummaries(items: MyRequestSummary[]) {
  const seen = new Set<string>();
  const unique: MyRequestSummary[] = [];

  for (const item of items) {
    const key = summaryKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

async function fetchMyRequestRows(params: Record<string, string>) {
  const res = await api.get<unknown>(`${MY_REQUESTS_BASE}/my`, { params });
  return extractRows(res.data);
}

async function fetchMyRequestsByScopeFallback(tab: MyRequestStatusTab): Promise<MyRequestSummary[]> {
  if (tab === "all") {
    const [activeResult, historyResult] = await Promise.allSettled([
      fetchMyRequestRows({ scope: "active" }),
      fetchMyRequestRows({ scope: "history" }),
    ]);

    const rows: any[] = [];
    if (activeResult.status === "fulfilled") rows.push(...activeResult.value);
    if (historyResult.status === "fulfilled") rows.push(...historyResult.value);

    if (rows.length === 0) {
      if (activeResult.status === "rejected") throw activeResult.reason;
      if (historyResult.status === "rejected") throw historyResult.reason;
      return [];
    }

    return dedupeSummaries(rows.map(normalizeSummary));
  }

  const scope: MyRequestScope = isHistoryTab(tab) ? "history" : "active";
  const rows = await fetchMyRequestRows({ scope });
  return rows.map(normalizeSummary);
}

export async function getCountsByStatus(): Promise<MyRequestCountsByStatus> {
  const res = await api.get<unknown>(`${MY_REQUESTS_BASE}/my/counts`);
  const payload = unwrapData(res.data);
  return normalizeCounts(payload && typeof payload === "object" ? payload : {});
}

export async function getMyRequests(params: { tab: MyRequestStatusTab }): Promise<MyRequestSummary[]> {
  const tab = normalizeMyRequestStatusTab(params.tab, "all");
  const requestTab: MyRequestStatusTab = tab;
  let primaryError: unknown = null;
  let primaryFiltered: MyRequestSummary[] = [];

  try {
    const primaryRows = await fetchMyRequestRows({ tab: requestTab });
    const primaryNormalized = primaryRows.map(normalizeSummary);
    primaryFiltered = applyTabFilter(primaryNormalized, tab);

    if (tab !== "all" && primaryFiltered.length > 0) {
      return primaryFiltered;
    }

    if (tab === "all" && primaryFiltered.length > 0) {
      const hasHistoryItem = primaryFiltered.some((item) => {
        const itemTab = toMyRequestStatusTabFromLabel(item.trackingLabel);
        return itemTab === "review" || itemTab === "resolved" || itemTab === "cancelled";
      });
      if (hasHistoryItem) {
        return primaryFiltered;
      }
    }
  } catch (error) {
    primaryError = error;
  }

  try {
    const fallbackNormalized = await fetchMyRequestsByScopeFallback(tab);
    const fallbackFiltered = applyTabFilter(fallbackNormalized, tab);
    const merged = dedupeSummaries([...primaryFiltered, ...fallbackFiltered]);
    if (merged.length > 0) {
      return tab === "all" ? merged : applyTabFilter(merged, tab);
    }
  } catch (fallbackError) {
    if (!primaryError) {
      primaryError = fallbackError;
    }
  }

  if (primaryFiltered.length > 0) return primaryFiltered;
  if (primaryError) throw primaryError;
  return [];
}

export async function fetchMyActiveRequest(): Promise<MyRequestSummary | null> {
  try {
    const res = await api.get<unknown>(`${MY_REQUESTS_BASE}/my/active`);
    const payload = unwrapData(res.data);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

    const normalized = normalizeSummary(payload);
    if (isCancelledLikeSummary(normalized)) return null;
    return normalized;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function fetchMyRequests(scope: MyRequestScope = "active"): Promise<MyRequestSummary[]> {
  const res = await api.get<unknown>(`${MY_REQUESTS_BASE}/my`, {
    params: { scope },
  });
  return extractRows(res.data).map(normalizeSummary);
}

export async function fetchMyRequestTracking(id: string): Promise<MyRequestTrackingDTO> {
  const requestId = String(id ?? "").trim();
  if (!requestId) throw new Error("Request id is required");

  const res = await api.get<unknown>(`${MY_REQUESTS_BASE}/my/${requestId}/tracking`);
  return unwrapData(res.data) as MyRequestTrackingDTO;
}

export async function cancelMyRequest(id: string): Promise<{ incidentId: string; referenceNumber: string; status: string }> {
  const requestId = String(id ?? "").trim();
  if (!requestId) throw new Error("Request id is required");

  const res = await api.patch<unknown>(
    `${MY_REQUESTS_BASE}/my/${requestId}/cancel`
  );
  return unwrapData(res.data) as { incidentId: string; referenceNumber: string; status: string };
}
