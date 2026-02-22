import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { EmergencyApprovalItem, EmergencyVerificationFilters } from "../models/approvals.types";
import {
  approveEmergencyReport,
  fetchPendingEmergencyVerifications,
  rejectEmergencyReport,
} from "../services/approvalsApi";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";

const rejectSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
});

const defaultFilters: EmergencyVerificationFilters = {
  q: "",
  emergencyType: "ALL",
  barangay: "",
  dateFrom: "",
  dateTo: "",
};

function toStartOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T00:00:00.000`);
  return d.toISOString();
}

function toEndOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T23:59:59.999`);
  return d.toISOString();
}

function safeIso(v?: string | null) {
  const s = String(v || "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function useEmergencyVerification() {
  const [items, setItems] = useState<EmergencyApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmergencyVerificationFilters>(defaultFilters);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingEmergencyVerifications();
      setItems(data);
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "Failed to load pending reports";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const emergencyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const v = String(item.type || "").trim();
      if (v) set.add(v);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const barangayQ = filters.barangay.trim().toLowerCase();
    const type = String(filters.emergencyType || "ALL");

    const fromIso = filters.dateFrom ? toStartOfDayIso(filters.dateFrom) : "";
    const toIso = filters.dateTo ? toEndOfDayIso(filters.dateTo) : "";

    return items.filter((item) => {
      const createdAtIso = safeIso(item.createdAt);
      if (fromIso && createdAtIso && createdAtIso < fromIso) return false;
      if (toIso && createdAtIso && createdAtIso > toIso) return false;

      const itemType = String(item.type || "").trim();
      if (type !== "ALL" && itemType !== type) return false;

      const barangay = String(item.barangay || "").toLowerCase();
      const locationLabel = String(item.locationLabel || "").toLowerCase();
      if (barangayQ && !barangay.includes(barangayQ) && !locationLabel.includes(barangayQ)) return false;

      if (q) {
        const hay = [
          item.incidentId,
          item.referenceNumber,
          item.type,
          item.barangay,
          item.locationLabel,
          item.reporter?.name,
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" | ");
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [items, filters]);

  const verify = useCallback(
    async (incidentId: string) => {
      try {
        setError(null);
        setVerifyingId(incidentId);
        await approveEmergencyReport(incidentId);
        toastSuccess("Emergency report approved.");
        await refresh();
      } catch (e: any) {
        const message = e?.response?.data?.message || e?.message || "Failed to approve report";
        setError(message);
        toastError(message);
      } finally {
        setVerifyingId(null);
      }
    },
    [refresh]
  );

  const validateRejectReason = useCallback((reason: string) => {
    const parsed = rejectSchema.safeParse({ reason });
    if (parsed.success) return { ok: true as const, error: "" };
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid reason" };
  }, []);

  const reject = useCallback(
    async (incidentId: string, reason: string) => {
      const v = validateRejectReason(reason);
      if (!v.ok) throw new Error(v.error);

      try {
        setError(null);
        setRejectingId(incidentId);
        await rejectEmergencyReport(incidentId, reason.trim());
        toastSuccess("Emergency report rejected.");
        await refresh();
      } catch (e: any) {
        const message = e?.response?.data?.message || e?.message || "Failed to reject report";
        setError(message);
        toastError(message);
      } finally {
        setRejectingId(null);
      }
    },
    [refresh, validateRejectReason]
  );

  return {
    items,
    filtered,
    loading,
    error,
    filters,
    setFilters,
    clearFilters: () => setFilters(defaultFilters),
    emergencyTypeOptions,
    refresh,
    verifyingId,
    rejectingId,
    verify,
    reject,
    validateRejectReason,
  };
}
