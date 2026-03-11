import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import type { DispatchModalData } from "../models/dispatchModal";
import { toDispatchModalData } from "../models/dispatchModal";
import { respondToDispatch } from "../services/dispatchApi";
import { setStoredActiveDispatch } from "../services/dispatchStorage";
import { DEFAULT_ASSIGNED_BY_LABEL } from "../constants/dispatchModal.constants";

type UseDispatchModalParams = {
  pendingDispatch: DispatchOffer | null;
  clearPending: () => void;
  refreshPending: () => Promise<unknown>;
  refreshActive: () => Promise<unknown>;
  onAcceptSuccess?: () => void;
  onDeclineSuccess?: () => void;
  onViewDetails?: (data: DispatchModalData) => void;
};

function formatDistance(distanceKm?: number | null) {
  if (!Number.isFinite(distanceKm)) return null;
  const numeric = Number(distanceKm);
  if (numeric < 0) return null;
  const rounded = numeric >= 10 ? numeric.toFixed(0) : numeric.toFixed(1);
  return `${rounded} km away`;
}

function formatEta(etaMinutes?: number | null) {
  if (!Number.isFinite(etaMinutes)) return null;
  const rounded = Math.max(1, Math.round(Number(etaMinutes)));
  return `ETA ${rounded} min${rounded === 1 ? "" : "s"}`;
}

function formatReportedTime(reportedAt?: string | null) {
  if (!reportedAt) return null;
  const timestamp = new Date(reportedAt).getTime();
  if (!Number.isFinite(timestamp)) return null;

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 10) return "Reported just now";
  if (diffSeconds < 60) return `Reported ${diffSeconds} seconds ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `Reported ${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Reported ${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `Reported ${days} day${days === 1 ? "" : "s"} ago`;
}

function toSeverityLabel(raw?: DispatchModalData["severity"]) {
  if (raw === "critical") return "Critical Severity";
  if (raw === "high") return "High Severity";
  if (raw === "medium") return "Medium Severity";
  return "Low Severity";
}

function toStatusLabel(raw?: DispatchModalData["status"], isEnRoute?: boolean) {
  if (raw === "accepted") return isEnRoute ? "En Route" : "Assigned";
  if (raw === "declined") return "Declined";
  if (raw === "cancelled") return "Cancelled";
  return "Pending Response";
}

export function useDispatchModal(params: UseDispatchModalParams) {
  const {
    pendingDispatch,
    clearPending,
    refreshPending,
    refreshActive,
    onAcceptSuccess,
    onDeclineSuccess,
    onViewDetails,
  } = params;

  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [dismissedAssignmentId, setDismissedAssignmentId] = useState<string | null>(null);

  const data = useMemo(() => toDispatchModalData(pendingDispatch), [pendingDispatch]);
  const visible = Boolean(
    data &&
      pendingDispatch?.status === "PENDING" &&
      pendingDispatch?.id &&
      pendingDispatch.id !== dismissedAssignmentId
  );
  const busy = accepting || declining;

  const assignedByText = useMemo(() => {
    if (!data?.lguName) return DEFAULT_ASSIGNED_BY_LABEL;
    return `Assigned by ${data.lguName}`;
  }, [data?.lguName]);

  const distanceText = useMemo(() => formatDistance(data?.distanceKm), [data?.distanceKm]);
  const etaText = useMemo(() => formatEta(data?.etaMinutes), [data?.etaMinutes]);
  const reportedTimeText = useMemo(() => formatReportedTime(data?.reportedAt), [data?.reportedAt]);

  const distanceEtaText = useMemo(() => {
    if (distanceText && etaText) return `${distanceText} | ${etaText}`;
    return distanceText || etaText || null;
  }, [distanceText, etaText]);

  const acceptDispatch = useCallback(async () => {
    if (!pendingDispatch) return;
    if (busy) return;

    try {
      setAccepting(true);
      const updated = await respondToDispatch(pendingDispatch.id, "ACCEPT");
      await setStoredActiveDispatch(updated);
      clearPending();
      await refreshActive();
      onAcceptSuccess?.();
    } catch (error: unknown) {
      const parsed = error as { response?: { data?: { message?: string } }; message?: string };
      const message = String(parsed?.response?.data?.message ?? parsed?.message ?? "").trim();
      const normalized = message.toLowerCase();
      const staleState = normalized.includes("not pending");

      if (staleState) {
        clearPending();
        await Promise.allSettled([refreshPending(), refreshActive()]);
        return;
      }

      Alert.alert("Failed", message || "Unable to accept dispatch.");
    } finally {
      setAccepting(false);
    }
  }, [pendingDispatch, busy, clearPending, refreshActive, onAcceptSuccess, refreshPending]);

  const declineDispatch = useCallback(async () => {
    if (!pendingDispatch) return;
    if (busy) return;

    try {
      setDeclining(true);
      await respondToDispatch(pendingDispatch.id, "DECLINE");
      clearPending();
      await refreshPending();
      onDeclineSuccess?.();
    } catch (error: unknown) {
      const parsed = error as { response?: { data?: { message?: string } }; message?: string };
      const message = String(parsed?.response?.data?.message ?? parsed?.message ?? "").trim();
      const normalized = message.toLowerCase();
      const staleState = normalized.includes("not pending");

      if (staleState) {
        clearPending();
        await Promise.allSettled([refreshPending(), refreshActive()]);
        return;
      }

      Alert.alert("Failed", message || "Unable to decline dispatch.");
    } finally {
      setDeclining(false);
    }
  }, [pendingDispatch, busy, clearPending, refreshPending, onDeclineSuccess, refreshActive]);

  const viewDetails = useCallback(() => {
    if (!data) return;
    onViewDetails?.(data);
  }, [data, onViewDetails]);

  const dismiss = useCallback(() => {
    if (!pendingDispatch?.id) return;
    setDismissedAssignmentId(pendingDispatch.id);
  }, [pendingDispatch?.id]);

  return {
    visible,
    data,
    accepting,
    declining,
    busy,
    assignedByText,
    distanceEtaText,
    reportedTimeText,
    severityLabel: toSeverityLabel(data?.severity),
    statusLabel: toStatusLabel(data?.status, data?.isEnRoute),
    acceptDispatch,
    declineDispatch,
    viewDetails,
    dismiss,
  };
}
