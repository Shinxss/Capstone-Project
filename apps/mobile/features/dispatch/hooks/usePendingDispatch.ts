import { useCallback, useEffect, useRef, useState } from "react";
import type { DispatchOffer } from "../models/dispatch";
import { fetchMyPendingDispatch } from "../services/dispatchApi";

export function usePendingDispatch(options?: { pollMs?: number; enabled?: boolean }) {
  const pollMs = options?.pollMs ?? 8000;
  const enabled = options?.enabled ?? true;
  const [pending, setPending] = useState<DispatchOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const server = await fetchMyPendingDispatch();
      setPending(server);
    } catch {
      // keep existing
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
    if (!enabled) return;
    if (pollMs <= 0) return;
    timerRef.current = setInterval(() => {
      refresh();
    }, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [pollMs, refresh, enabled]);

  const clear = useCallback(() => setPending(null), []);

  return { pendingDispatch: pending, loading, refresh, clear };
}
