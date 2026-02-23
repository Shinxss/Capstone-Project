import { useCallback, useEffect, useMemo, useState } from "react";
import { useLguSession } from "@/features/auth/hooks/useLguSession";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import { exportAuditLogsCsv, fetchAuditLogs, type AuditLogsQuery } from "../services/auditTrails.service";
import type { AuditLogItem } from "../models/auditTrails.types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useAdminAuditTrails() {
  const { user } = useLguSession();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState<AuditLogsQuery>({
    page: 1,
    limit: 30,
    q: "",
    eventType: "",
    outcome: "",
    severity: "",
    from: "",
    to: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(query);
      setItems(data.items ?? []);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canExport = useMemo(() => user?.role === "ADMIN" && user?.adminTier === "SUPER", [user?.adminTier, user?.role]);

  const onExport = useCallback(async () => {
    if (!canExport) return;
    setExporting(true);
    try {
      const blob = await exportAuditLogsCsv(query);
      downloadBlob(blob, `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      toastSuccess("Audit logs exported.");
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  }, [canExport, query]);

  return {
    items,
    loading,
    error,
    query,
    setQuery,
    pagination,
    refresh,
    canExport,
    exporting,
    onExport,
  };
}
