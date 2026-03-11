import { useCallback, useEffect, useState } from "react";
import type { ProfileSummary } from "../../profile/models/profile";
import { getProfileSummary } from "../../profile/services/profileApi";
import {
  createDispatchFocusStatsFallback,
  normalizeDispatchFocusStats,
  type DispatchFocusStats,
} from "../models/dispatchFocusStats";
import { fetchMyDispatchFocusStats } from "../services/dispatchApi";

type UseTaskFocusStatsParams = {
  enabled: boolean;
  autoLoad?: boolean;
};

type RefreshOptions = {
  showLoading?: boolean;
};

function buildFallbackFromProfileSummary(summary: ProfileSummary) {
  return createDispatchFocusStatsFallback({
    volunteerHours: summary.stats.volunteerHours,
    completedCount: summary.stats.verifiedTasks || summary.stats.completedTasks,
  });
}

export function useTaskFocusStats(params: UseTaskFocusStatsParams) {
  const { enabled, autoLoad = true } = params;
  const [stats, setStats] = useState<DispatchFocusStats>(createDispatchFocusStatsFallback());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      const showLoading = options?.showLoading ?? true;

      if (!enabled) {
        setStats(createDispatchFocusStatsFallback());
        if (showLoading) setLoading(false);
        return;
      }

      if (showLoading) setLoading(true);

      try {
        const [focusStatsResult, profileSummaryResult] = await Promise.allSettled([
          fetchMyDispatchFocusStats(),
          getProfileSummary(),
        ]);

        if (focusStatsResult.status === "fulfilled") {
          setStats(normalizeDispatchFocusStats(focusStatsResult.value));
          return;
        }

        if (profileSummaryResult.status === "fulfilled") {
          setStats(buildFallbackFromProfileSummary(profileSummaryResult.value));
          return;
        }

        setStats(createDispatchFocusStatsFallback());
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, refresh]);

  return {
    stats,
    loading,
    refresh,
  };
}
