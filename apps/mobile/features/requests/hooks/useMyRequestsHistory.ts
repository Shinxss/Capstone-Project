import { useCallback, useEffect, useState } from "react";
import type { MyRequestStatusTab, MyRequestSummary } from "../models/myRequests";
import { getMyRequests } from "../services/myRequestsApi";

type Options = {
  enabled?: boolean;
};

export function useMyRequestsHistory(tab: MyRequestStatusTab, options?: Options) {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<MyRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setError(null);
      return;
    }

    try {
      const next = await getMyRequests({ tab });
      setItems(next);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load requests");
    }
  }, [enabled, tab]);

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
    items,
    loading,
    error,
    refresh,
  };
}
