import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type {
  EmergencyApprovalItem,
  EmergencyVerificationFilters,
} from "../models/approvals.types";
import {
  approveEmergencyReport,
  fetchApprovalReportFeed,
  fetchPendingEmergencyVerifications,
  rejectEmergencyReport,
} from "../services/approvalsApi";
import { toApprovalItem } from "../utils/approval.utils";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

const rejectSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
});

const defaultFilters: EmergencyVerificationFilters = {
  q: "",
  emergencyType: "ALL",
  barangay: "ALL",
  dateFrom: "",
  dateTo: "",
  status: "ALL",
  sort: "LATEST",
};

function toStartOfDay(dateYmd: string) {
  return new Date(`${dateYmd}T00:00:00`).getTime();
}

function toEndOfDay(dateYmd: string) {
  return new Date(`${dateYmd}T23:59:59.999`).getTime();
}

function timestamp(value?: string) {
  const result = new Date(value || "").getTime();
  return Number.isFinite(result) ? result : 0;
}

function severityRank(item: EmergencyApprovalItem) {
  if (item.severity === "high") return 0;
  if (item.severity === "medium") return 1;
  return 2;
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

function startOfWeek() {
  const value = new Date();
  const day = value.getDay();
  value.setDate(value.getDate() - (day === 0 ? 6 : day - 1));
  value.setHours(0, 0, 0, 0);
  return value.getTime();
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
      const [reports, pending] = await Promise.all([
        fetchApprovalReportFeed(),
        fetchPendingEmergencyVerifications(),
      ]);
      const pendingById = new Map(pending.map((item) => [String(item.incidentId), item]));
      const mapped = reports
        .map((report) => toApprovalItem(report, pendingById.get(String(report._id))))
        .filter((item): item is EmergencyApprovalItem => Boolean(item))
        .sort((a, b) => timestamp(b.reportedAt || b.createdAt) - timestamp(a.reportedAt || a.createdAt));
      setItems(mapped);
    } catch (caught: unknown) {
      const withResponse = caught as { response?: { data?: { message?: string } }; message?: string };
      const message = withResponse.response?.data?.message || withResponse.message || "Failed to load reports";
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
    const values = new Set(items.map((item) => item.type).filter(Boolean));
    return ["ALL", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const barangayOptions = useMemo(() => {
    const values = new Set(items.map((item) => item.barangay).filter((value) => value && value !== "Unknown"));
    return ["ALL", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    const from = filters.dateFrom ? toStartOfDay(filters.dateFrom) : 0;
    const to = filters.dateTo ? toEndOfDay(filters.dateTo) : Number.POSITIVE_INFINITY;

    const matches = items.filter((item) => {
      const reported = timestamp(item.reportedAt || item.createdAt);
      if (reported < from || reported > to) return false;
      if (filters.emergencyType !== "ALL" && item.type !== filters.emergencyType) return false;
      if (filters.barangay !== "ALL" && item.barangay !== filters.barangay) return false;
      if (filters.status !== "ALL" && item.status !== filters.status) return false;
      if (!query) return true;

      return [
        item.incidentId,
        item.referenceNumber,
        item.type,
        item.title,
        item.barangay,
        item.locationLabel,
        item.description,
        item.reporter.name,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(query));
    });

    return matches.sort((a, b) => {
      if (filters.sort === "SEVERITY") {
        const difference = severityRank(a) - severityRank(b);
        if (difference !== 0) return difference;
      }
      const aTime = timestamp(a.reportedAt || a.createdAt);
      const bTime = timestamp(b.reportedAt || b.createdAt);
      return filters.sort === "OLDEST" ? aTime - bTime : bTime - aTime;
    });
  }, [filters, items]);

  const stats = useMemo(() => {
    const today = startOfToday();
    const week = startOfWeek();
    return {
      pending: items.filter((item) => item.status === "pending").length,
      approvedToday: items.filter(
        (item) => item.status === "approved" && timestamp(item.reviewedAt || item.updatedAt) >= today
      ).length,
      rejectedToday: items.filter(
        (item) => item.status === "rejected" && timestamp(item.reviewedAt || item.updatedAt) >= today
      ).length,
      totalThisWeek: items.filter((item) => timestamp(item.reportedAt || item.createdAt) >= week).length,
    };
  }, [items]);

  const verify = useCallback(
    async (incidentId: string) => {
      try {
        setError(null);
        setVerifyingId(incidentId);
        await approveEmergencyReport(incidentId);
        const approved = items.find((item) => item.incidentId === incidentId);
        appendActivityLog({
          action: "Approved emergency report",
          entityType: "emergency",
          entityId: incidentId,
          metadata: {
            referenceNumber: approved?.referenceNumber,
            emergencyType: approved?.type,
            barangay: approved?.barangay,
          },
        });
        toastSuccess("Emergency report approved.");
        await refresh();
        return true;
      } catch (caught: unknown) {
        const withResponse = caught as { response?: { data?: { message?: string } }; message?: string };
        const message = withResponse.response?.data?.message || withResponse.message || "Failed to approve report";
        setError(message);
        toastError(message);
        return false;
      } finally {
        setVerifyingId(null);
      }
    },
    [items, refresh]
  );

  const validateRejectReason = useCallback((reason: string) => {
    const parsed = rejectSchema.safeParse({ reason });
    if (parsed.success) return { ok: true as const, error: "" };
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid reason" };
  }, []);

  const reject = useCallback(
    async (incidentId: string, reason: string) => {
      const validation = validateRejectReason(reason);
      if (!validation.ok) throw new Error(validation.error);

      try {
        setError(null);
        setRejectingId(incidentId);
        await rejectEmergencyReport(incidentId, reason.trim());
        const rejected = items.find((item) => item.incidentId === incidentId);
        appendActivityLog({
          action: "Rejected emergency report",
          entityType: "emergency",
          entityId: incidentId,
          metadata: {
            reason: reason.trim(),
            referenceNumber: rejected?.referenceNumber,
            emergencyType: rejected?.type,
            barangay: rejected?.barangay,
          },
        });
        toastSuccess("Emergency report rejected.");
        await refresh();
        return true;
      } catch (caught: unknown) {
        const withResponse = caught as { response?: { data?: { message?: string } }; message?: string };
        const message = withResponse.response?.data?.message || withResponse.message || "Failed to reject report";
        setError(message);
        toastError(message);
        return false;
      } finally {
        setRejectingId(null);
      }
    },
    [items, refresh, validateRejectReason]
  );

  return {
    items,
    filtered,
    stats,
    loading,
    error,
    filters,
    setFilters,
    clearFilters: () => setFilters(defaultFilters),
    emergencyTypeOptions,
    barangayOptions,
    refresh,
    verifyingId,
    rejectingId,
    verify,
    reject,
    validateRejectReason,
  };
}
