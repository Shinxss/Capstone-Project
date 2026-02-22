import { api } from "../../../lib/api";
import type { EmergencyApprovalItem } from "../models/approvals.types";

const BASE = "/api/lgu/approvals/emergency-reports";

type ListResponse = { data?: EmergencyApprovalItem[] };

export async function fetchPendingEmergencyVerifications(): Promise<EmergencyApprovalItem[]> {
  const res = await api.get<ListResponse>(BASE, { params: { status: "pending" } });
  return Array.isArray(res.data?.data) ? res.data!.data! : [];
}

export async function approveEmergencyReport(incidentId: string) {
  await api.patch(`${BASE}/${incidentId}/approve`);
}

export async function rejectEmergencyReport(incidentId: string, reason: string) {
  await api.patch(`${BASE}/${incidentId}/reject`, { reason });
}
