import { useCallback, useEffect, useRef, useState } from "react";
import type { MyRequestSummary } from "../models/myRequests";
import { fetchMyActiveRequest } from "../services/myRequestsApi";

type Options = {
  pollMs?: number;
  enabled?: boolean;
};

export function useMyActiveRequest(options?: Options) {
  const pollMs = options?.pollMs ?? 8000;
  const enabled = options?.enabled ?? true;
  const [activeRequest, setActiveRequest] = useState<MyRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActiveRequest(null);
      setError(null);
      return;
    }

    try {
      const next = await fetchMyActiveRequest();
      setActiveRequest(next);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to fetch active request");
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

  useEffect(() => {
    if (!enabled || pollMs <= 0) return;

    timerRef.current = setInterval(() => {
      void refresh();
    }, pollMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, pollMs, refresh]);

  return {
    activeRequest,
    loading,
    error,
    refresh,
  };
}
