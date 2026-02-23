import { api } from "@/lib/api";
import type { AuditLogListResponse } from "../models/auditTrails.types";

export type AuditLogsQuery = {
  from?: string;
  to?: string;
  eventType?: string;
  outcome?: string;
  severity?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export async function fetchAuditLogs(query: AuditLogsQuery) {
  const res = await api.get<AuditLogListResponse>("/api/audit", { params: query });
  return res.data;
}

export async function exportAuditLogsCsv(query: AuditLogsQuery) {
  const res = await api.get<Blob>("/api/audit/export/csv", {
    params: query,
    responseType: "blob",
  });
  return res.data;
}
