import axios from "axios";
import { api } from "../../../lib/api";
import type {
  MyRequestScope,
  MyRequestSummary,
  MyRequestTrackingDTO,
} from "../models/myRequests";

const MY_REQUESTS_BASE = "/api/emergency/reports";

function normalizeSummary(raw: any): MyRequestSummary {
  return {
    id: String(raw?.id ?? ""),
    referenceNumber: String(raw?.referenceNumber ?? ""),
    type: String(raw?.type ?? "other"),
    status: String(raw?.status ?? "OPEN"),
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    location: {
      lng: Number(raw?.location?.lng ?? 0),
      lat: Number(raw?.location?.lat ?? 0),
    },
    trackingStatus: String(raw?.trackingStatus ?? "Submitted") as MyRequestSummary["trackingStatus"],
    etaSeconds: raw?.etaSeconds === null || raw?.etaSeconds === undefined
      ? null
      : Number(raw?.etaSeconds),
    lastUpdatedAt:
      raw?.lastUpdatedAt === null || raw?.lastUpdatedAt === undefined
        ? null
        : String(raw?.lastUpdatedAt),
  };
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
