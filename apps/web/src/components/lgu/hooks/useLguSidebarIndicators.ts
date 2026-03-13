import { useCallback, useEffect, useRef, useState } from "react";
import { getLguToken } from "../../../features/auth/services/authStorage";
import { fetchEmergencyReports } from "../../../features/emergency/services/emergency.service";
import { fetchPendingEmergencyVerifications } from "../../../features/approvals/services/approvalsApi";
import { fetchLguTasksByStatus } from "../../../features/tasks/services/tasksApi";
import { listVolunteerApplications } from "../../../features/volunteer/services/lguVolunteerApplications.service";
import {
  createNotificationsSocket,
  type NotificationsRefreshPayload,
} from "../../../features/notifications/services/notifications.socket";

type SidebarIndicators = {
  pendingApplicants: number;
  forReviewTasks: number;
  pendingEmergencies: number;
  pendingEmergencyApprovals: number;
};

const POLL_INTERVAL_MS = 45_000;

const DEFAULT_INDICATORS: SidebarIndicators = {
  pendingApplicants: 0,
  forReviewTasks: 0,
  pendingEmergencies: 0,
  pendingEmergencyApprovals: 0,
};

function toSafeCount(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function extractApplicantsTotal(payload: unknown) {
  const raw = payload as any;
  return toSafeCount(raw?.total ?? raw?.pagination?.total ?? 0);
}

function isActiveEmergencyStatus(raw: unknown) {
  const status = String(raw ?? "").trim().toUpperCase();
  return status !== "RESOLVED" && status !== "CANCELLED";
}

function toPendingEmergenciesCount(reports: unknown[]) {
  return Array.isArray(reports)
    ? reports.filter((report: any) => isActiveEmergencyStatus(report?.status)).length
    : 0;
}

function toPendingApprovalsFallbackCount(reports: unknown[]) {
  if (!Array.isArray(reports)) return 0;
  return reports.filter((report: any) => {
    if (!isActiveEmergencyStatus(report?.status)) return false;

    const emergencyType = String(report?.emergencyType ?? "").trim().toUpperCase();
    const source = String(report?.source ?? "").trim().toUpperCase();
    const verification = String(report?.verification?.status ?? "").trim().toLowerCase();

    const isSos = emergencyType === "SOS" || source === "SOS_BUTTON";
    if (isSos) return false;

    // Legacy records may not have verification; treat active non-SOS as pending verification.
    return verification === "" || verification === "pending";
  }).length;
}

export function useLguSidebarIndicators() {
  const [indicators, setIndicators] = useState<SidebarIndicators>(DEFAULT_INDICATORS);
  const mountedRef = useRef(true);
  const refreshingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) {
      await refreshingRef.current;
      return;
    }

    const pending = (async () => {
      const [applicantsRes, tasksForReview, emergencyApprovals, emergencyReports] = await Promise.allSettled([
        listVolunteerApplications({
          status: ["pending_verification"],
          page: 1,
          limit: 1,
        }),
        fetchLguTasksByStatus("DONE"),
        fetchPendingEmergencyVerifications(),
        fetchEmergencyReports(300),
      ]);

      if (!mountedRef.current) return;

      const pendingEmergenciesFromReports =
        emergencyReports.status === "fulfilled"
          ? toPendingEmergenciesCount(emergencyReports.value)
          : null;

      const pendingApprovalsFromApi =
        emergencyApprovals.status === "fulfilled"
          ? Array.isArray(emergencyApprovals.value)
            ? emergencyApprovals.value.length
            : 0
          : null;

      const pendingApprovalsFromReports =
        emergencyReports.status === "fulfilled"
          ? toPendingApprovalsFallbackCount(emergencyReports.value)
          : null;

      const nextPendingApprovals =
        pendingApprovalsFromApi !== null && pendingApprovalsFromReports !== null
          ? Math.max(pendingApprovalsFromApi, pendingApprovalsFromReports)
          : pendingApprovalsFromApi ?? pendingApprovalsFromReports ?? null;

      setIndicators((prev) => ({
        pendingApplicants:
          applicantsRes.status === "fulfilled"
            ? extractApplicantsTotal(applicantsRes.value)
            : prev.pendingApplicants,
        forReviewTasks:
          tasksForReview.status === "fulfilled"
            ? Array.isArray(tasksForReview.value)
              ? tasksForReview.value.length
              : 0
            : prev.forReviewTasks,
        pendingEmergencies:
          pendingEmergenciesFromReports !== null
            ? pendingEmergenciesFromReports
            : prev.pendingEmergencies,
        pendingEmergencyApprovals:
          nextPendingApprovals !== null
            ? nextPendingApprovals
            : prev.pendingEmergencyApprovals,
      }));
    })();

    refreshingRef.current = pending.finally(() => {
      refreshingRef.current = null;
    });

    await refreshingRef.current;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  useEffect(() => {
    const token = getLguToken();
    if (!token) return;

    let lastRefreshAt = 0;
    const socket = createNotificationsSocket(token);

    const onRefresh = (_payload: NotificationsRefreshPayload) => {
      const now = Date.now();
      if (now - lastRefreshAt < 1500) return;
      lastRefreshAt = now;
      void refresh();
    };

    socket.on("notifications:refresh", onRefresh);
    socket.connect();

    return () => {
      socket.off("notifications:refresh", onRefresh);
      socket.disconnect();
    };
  }, [refresh]);

  return indicators;
}
