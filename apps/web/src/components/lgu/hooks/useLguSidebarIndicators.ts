import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPendingEmergencyVerifications } from "../../../features/approvals/services/approvalsApi";
import { fetchLguTasksByStatus } from "../../../features/tasks/services/tasksApi";
import { listVolunteerApplications } from "../../../features/volunteer/services/lguVolunteerApplications.service";

type SidebarIndicators = {
  pendingApplicants: number;
  forReviewTasks: number;
  pendingEmergencyApprovals: number;
};

const POLL_INTERVAL_MS = 45_000;

const DEFAULT_INDICATORS: SidebarIndicators = {
  pendingApplicants: 0,
  forReviewTasks: 0,
  pendingEmergencyApprovals: 0,
};

function toSafeCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
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
      try {
        const [applicantsRes, tasksForReview, emergencyApprovals] = await Promise.all([
          listVolunteerApplications({
            status: ["pending_verification"],
            page: 1,
            limit: 1,
          }),
          fetchLguTasksByStatus("DONE"),
          fetchPendingEmergencyVerifications(),
        ]);

        if (!mountedRef.current) return;

        setIndicators({
          pendingApplicants: toSafeCount(applicantsRes?.total),
          forReviewTasks: Array.isArray(tasksForReview) ? tasksForReview.length : 0,
          pendingEmergencyApprovals: Array.isArray(emergencyApprovals) ? emergencyApprovals.length : 0,
        });
      } catch {
        // Silent fail: indicators are non-critical UI metadata.
      }
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

  return indicators;
}
