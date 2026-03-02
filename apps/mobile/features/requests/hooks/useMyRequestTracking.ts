import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MyRequestTrackingDTO } from "../models/myRequests";
import { fetchMyRequestTracking } from "../services/myRequestsApi";
import { formatRelativeTime } from "../utils/formatters";

type Options = {
  pollMs?: number;
  enabled?: boolean;
};

export function useMyRequestTracking(id: string | null | undefined, options?: Options) {
  const requestId = String(id ?? "").trim();
  const pollMs = options?.pollMs ?? 6000;
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<MyRequestTrackingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !requestId) {
      setData(null);
      setError(null);
      return;
    }

    try {
      const next = await fetchMyRequestTracking(requestId);
      setData(next);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to fetch request tracking");
    }
  }, [enabled, requestId]);

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
    if (!enabled || !requestId || pollMs <= 0) return;

    pollRef.current = setInterval(() => {
      void refresh();
    }, pollMs);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [enabled, pollMs, refresh, requestId]);

  useEffect(() => {
    if (!enabled || !requestId) return;
    tickerRef.current = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [enabled, requestId]);

  const lastUpdatedAgoText = useMemo(
    () => formatRelativeTime(data?.tracking?.lastUpdatedAt ?? null, nowMs),
    [data?.tracking?.lastUpdatedAt, nowMs]
  );

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdatedAgoText,
  };
}
