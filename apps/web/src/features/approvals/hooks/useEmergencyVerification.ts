import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import type { EmergencyVerificationFilters } from "../models/approvals.types";
import {
  approveAndVerifyDispatch,
  fetchPendingEmergencyVerifications,
  fetchProofBlob,
  rejectDispatch,
} from "../services/approvalsApi";

const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Reason must be at least 5 characters"),
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

function dispatchDateForFilter(t: DispatchTask) {
  return (
    safeIso(t.emergency?.reportedAt) ||
    safeIso(t.completedAt) ||
    safeIso(t.updatedAt) ||
    safeIso(t.createdAt) ||
    ""
  );
}

export function useEmergencyVerification() {
  const [items, setItems] = useState<DispatchTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmergencyVerificationFilters>(defaultFilters);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Proof preview state (used by Evidence modal)
  const [proofOpen, setProofOpen] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofObjectUrl, setProofObjectUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>("proof");
  const objectUrlRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingEmergencyVerifications();
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const emergencyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of items) {
      const v = String(t.emergency?.emergencyType || "").trim();
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

    return items.filter((t) => {
      const dt = dispatchDateForFilter(t);
      if (fromIso && dt && dt < fromIso) return false;
      if (toIso && dt && dt > toIso) return false;

      const eType = String(t.emergency?.emergencyType || "").trim();
      if (type !== "ALL" && eType !== type) return false;

      const brgy = String(t.emergency?.barangayName || "").toLowerCase();
      if (barangayQ && !brgy.includes(barangayQ)) return false;

      if (q) {
        const hay = [
          t.id,
          t.emergency?.id,
          t.emergency?.emergencyType,
          t.emergency?.barangayName,
          t.volunteer?.name,
          t.status,
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" | ");
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [items, filters]);

  const verify = useCallback(
    async (dispatchId: string) => {
      try {
        setError(null);
        setVerifyingId(dispatchId);
        await approveAndVerifyDispatch(dispatchId);
        await refresh();
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to verify dispatch");
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
    async (dispatchId: string, reason: string) => {
      const v = validateRejectReason(reason);
      if (!v.ok) throw new Error(v.error);

      try {
        setError(null);
        setRejectingId(dispatchId);
        await rejectDispatch(dispatchId, reason.trim());
        await refresh();
      } finally {
        setRejectingId(null);
      }
    },
    [refresh, validateRejectReason]
  );

  const closeProof = useCallback(() => {
    setProofOpen(false);
    setProofError(null);
    setProofLoading(false);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setProofObjectUrl(null);
  }, []);

  const openProof = useCallback(
    async (proofUrl: string, fileName?: string) => {
      try {
        setProofError(null);
        setProofLoading(true);
        setProofOpen(true);

        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
        setProofObjectUrl(null);

        setProofFileName(fileName || "proof");

        const blob = await fetchProofBlob(proofUrl);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setProofObjectUrl(objectUrl);
      } catch (e: any) {
        setProofError(e?.message || "Failed to load proof");
      } finally {
        setProofLoading(false);
      }
    },
    []
  );

  const downloadProof = useCallback(() => {
    if (!proofObjectUrl) return;
    const a = document.createElement("a");
    a.href = proofObjectUrl;
    a.download = proofFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [proofObjectUrl, proofFileName]);

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
    proofOpen,
    proofLoading,
    proofError,
    proofObjectUrl,
    openProof,
    closeProof,
    downloadProof,
  };
}

