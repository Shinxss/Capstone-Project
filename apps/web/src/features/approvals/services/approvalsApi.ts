import { api } from "../../../lib/api";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type {
  EmergencyApprovalDetailResponse,
  PendingEmergencyApproval,
} from "../models/approvals.types";

const BASE = "/api/lgu/approvals/emergency-reports";

type ListResponse = { data?: PendingEmergencyApproval[] };

export async function fetchPendingEmergencyVerifications(): Promise<PendingEmergencyApproval[]> {
  const res = await api.get<ListResponse>(BASE, { params: { status: "pending" } });
  return Array.isArray(res.data?.data) ? res.data!.data! : [];
}

export async function fetchApprovalReportFeed(): Promise<EmergencyReport[]> {
  const res = await api.get<{ data?: EmergencyReport[] }>("/api/emergencies/reports", {
    params: { limit: 500 },
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function fetchEmergencyApprovalDetail(incidentId: string) {
  const res = await api.get<EmergencyApprovalDetailResponse>(
    `/api/emergency/reports/${encodeURIComponent(incidentId)}`
  );
  return res.data;
}

export async function fetchApprovalEvidenceBlob(photoUrl: string) {
  const res = await api.get<Blob>(photoUrl, { responseType: "blob" });
  return res.data;
}

export async function approveEmergencyReport(incidentId: string) {
  await api.patch(`${BASE}/${incidentId}/approve`);
}

export async function rejectEmergencyReport(incidentId: string, reason: string) {
  await api.patch(`${BASE}/${incidentId}/reject`, { reason });
}
