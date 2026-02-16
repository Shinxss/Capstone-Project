import { api } from "../../../lib/api";
import { getLguToken } from "../../auth/services/authStorage";
import type { DispatchTask } from "../models/tasks.types";

type ListResp = { data: DispatchTask[]; count?: number };

type OneResp = { data: DispatchTask };

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchLguTasksByStatus(status: string) {
  const res = await api.get<ListResp>(`/api/dispatches`, {
    params: { status },
  });
  return res.data.data ?? [];
}

export async function verifyTask(dispatchId: string) {
  const res = await api.patch<OneResp>(`/api/dispatches/${dispatchId}/verify`, {});
  return res.data.data;
}

export async function fetchTaskProofBlob(proofUrl: string) {
  const token = getLguToken();
  if (!token) throw new Error("Missing access token. Please login again.");

  const res = await fetch(`${API_BASE}${proofUrl}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let msg = `Failed to load proof (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return await res.blob();
}
