import { useCallback, useEffect, useState } from "react";
import type { MyRequestCountsByStatus } from "../models/myRequests";
import { getCountsByStatus } from "../services/myRequestsApi";

const EMPTY_COUNTS: MyRequestCountsByStatus = {
  assigned: 0,
  en_route: 0,
  arrived: 0,
  resolved: 0,
};

type Options = {
  enabled?: boolean;
};

export function useMyRequestCounts(options?: Options) {
  const enabled = options?.enabled ?? true;
  const [counts, setCounts] = useState<MyRequestCountsByStatus>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCounts(EMPTY_COUNTS);
      setError(null);
      return;
    }

    try {
      const next = await getCountsByStatus();
      setCounts(next);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load request counts");
    }
  }, [enabled]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await refresh();
      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [refresh]);

  return {
    counts,
    loading,
    error,
    refresh,
  };
}
