import { useCallback, useEffect, useRef, useState } from "react";

type UsePullToRefreshOptions = {
  minSpinnerMs?: number;
  onError?: (error: unknown) => void;
};

function wait(ms: number) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options?: UsePullToRefreshOptions
) {
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const minSpinnerMs = options?.minSpinnerMs ?? 400;
  const onError = options?.onError;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (mountedRef.current) {
      setRefreshing(true);
    }

    const startMs = Date.now();
    try {
      await onRefresh();
    } catch (error) {
      onError?.(error);
    } finally {
      const elapsedMs = Date.now() - startMs;
      await wait(minSpinnerMs - elapsedMs);

      inFlightRef.current = false;
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [minSpinnerMs, onError, onRefresh]);

  return {
    refreshing,
    triggerRefresh,
  };
}
