import { api } from "../../../lib/api";
import { getLguToken } from "../../auth/services/authStorage";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import { fetchLguTasksByStatus, verifyTask } from "../../tasks/services/tasksApi";
import type { DispatchRejection } from "../models/approvals.types";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

const REJECTIONS_KEY = "lifeline_lgu_dispatch_rejections_v1";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readRejections(): DispatchRejection[] {
  const raw = safeJsonParse<DispatchRejection[]>(localStorage.getItem(REJECTIONS_KEY));
  return Array.isArray(raw) ? raw.filter((x) => x && typeof x.dispatchId === "string") : [];
}

function writeRejections(next: DispatchRejection[]) {
  localStorage.setItem(REJECTIONS_KEY, JSON.stringify(next.slice(0, 2000)));
}

export function listDispatchRejections(): DispatchRejection[] {
  return readRejections().sort((a, b) => String(b.rejectedAt).localeCompare(String(a.rejectedAt)));
}

export function recordDispatchRejection(input: { dispatchId: string; reason: string; actor?: string }) {
  const now = new Date().toISOString();
  const next: DispatchRejection[] = [
    { dispatchId: input.dispatchId, reason: input.reason, rejectedAt: now, actor: input.actor },
    ...readRejections().filter((r) => r.dispatchId !== input.dispatchId),
  ];
  writeRejections(next);

  appendActivityLog({
    action: "Rejected dispatch verification",
    entityType: "dispatch",
    entityId: input.dispatchId,
    metadata: { reason: input.reason },
  });
}

export function isDispatchRejected(dispatchId: string) {
  return readRejections().some((r) => r.dispatchId === dispatchId);
}

export async function fetchPendingEmergencyVerifications(): Promise<DispatchTask[]> {
  // Server: GET /api/dispatches?status=DONE
  const list = await fetchLguTasksByStatus("DONE");
  const rejected = new Set(readRejections().map((r) => r.dispatchId));
  return list.filter((t) => !rejected.has(String(t.id)));
}

export async function approveAndVerifyDispatch(dispatchId: string): Promise<DispatchTask> {
  // Server: PATCH /api/dispatches/:id/verify
  const updated = await verifyTask(dispatchId);
  appendActivityLog({
    action: "Verified dispatch completion",
    entityType: "dispatch",
    entityId: dispatchId,
    metadata: null,
  });
  return updated;
}

export async function rejectDispatch(dispatchId: string, reason: string) {
  // TODO: Implement backend endpoint (example): PATCH /api/dispatches/:id/reject { reason }
  // Until then, try an endpoint and fall back to local rejection if it 404s.
  try {
    await api.patch(`/api/dispatches/${dispatchId}/reject`, { reason });
    appendActivityLog({
      action: "Rejected dispatch (server)",
      entityType: "dispatch",
      entityId: dispatchId,
      metadata: { reason },
    });
    return { ok: true as const, mode: "api" as const };
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 404) {
      recordDispatchRejection({ dispatchId, reason });
      return { ok: true as const, mode: "local" as const };
    }
    throw new Error(e?.response?.data?.message || e?.message || "Failed to reject dispatch");
  }
}

export async function fetchProofBlob(proofUrl: string) {
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

