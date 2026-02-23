import { useCallback, useEffect, useState } from "react";
import type { AdminAnalyticsOverview } from "../models/adminAnalytics.types";
import { fetchAdminAnalyticsOverview } from "../services/adminAnalytics.service";

export function useAdminAnalytics() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAdminAnalyticsOverview(range);
      setData(next);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    range,
    setRange,
    data,
    loading,
    error,
    refresh,
  };
}
