import { api } from "../../../lib/api";
import axios from "axios";
import type { DispatchOffer } from "../models/dispatch";
import type { DispatchFocusStats } from "../models/dispatchFocusStats";

type ApiResponse<T> = { data: T };

type UploadProofBody = {
  base64: string;
  mimeType?: string;
  fileName?: string;
};

type DispatchLocationBody = {
  lng: number;
  lat: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
};

export async function fetchMyPendingDispatch(): Promise<DispatchOffer | null> {
  try {
    const res = await api.get<ApiResponse<DispatchOffer | null>>("/api/dispatches/my/pending");
    return res.data.data ?? null;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function fetchMyActiveDispatch(): Promise<DispatchOffer | null> {
  try {
    const res = await api.get<ApiResponse<DispatchOffer | null>>("/api/dispatches/my/active");
    return res.data.data ?? null;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

// Tasks screen: ACCEPTED or DONE
export async function fetchMyCurrentDispatch(): Promise<DispatchOffer | null> {
  try {
    const res = await api.get<ApiResponse<DispatchOffer | null>>("/api/dispatches/my/current");
    return res.data.data ?? null;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

// Tasks screen: volunteer completed history (VERIFIED)
export async function fetchMyCompletedDispatches(): Promise<DispatchOffer[]> {
  const res = await api.get<ApiResponse<DispatchOffer[]>>("/api/dispatches/my/completed");
  return Array.isArray(res.data.data) ? res.data.data : [];
}

export async function fetchMyDispatchFocusStats(): Promise<DispatchFocusStats> {
  const res = await api.get<ApiResponse<DispatchFocusStats>>("/api/dispatches/my/focus-stats");
  return res.data.data;
}

export async function respondToDispatch(dispatchId: string, decision: "ACCEPT" | "DECLINE"): Promise<DispatchOffer> {
  const res = await api.patch<ApiResponse<DispatchOffer>>(`/api/dispatches/${dispatchId}/respond`, {
    decision,
  });
  return res.data.data;
}

export async function uploadDispatchProof(dispatchId: string, body: UploadProofBody): Promise<DispatchOffer> {
  const res = await api.post<ApiResponse<DispatchOffer>>(`/api/dispatches/${dispatchId}/proof`, body);
  return res.data.data;
}

export async function completeDispatch(dispatchId: string): Promise<DispatchOffer> {
  const res = await api.patch<ApiResponse<DispatchOffer>>(`/api/dispatches/${dispatchId}/complete`, {});
  return res.data.data;
}

export async function updateDispatchLocation(
  dispatchId: string,
  body: DispatchLocationBody
): Promise<DispatchOffer> {
  const res = await api.patch<ApiResponse<DispatchOffer>>(`/api/dispatches/${dispatchId}/location`, body);
  return res.data.data;
}
