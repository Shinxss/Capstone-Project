import { useCallback, useEffect, useRef, useState } from "react";
import type { DispatchOffer } from "../models/dispatch";
import { fetchMyActiveDispatch } from "../services/dispatchApi";
import { getStoredActiveDispatch, setStoredActiveDispatch } from "../services/dispatchStorage";

export function useActiveDispatch(options?: { pollMs?: number }) {
  const pollMs = options?.pollMs ?? 8000;
  const [active, setActive] = useState<DispatchOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    try {
      const server = await fetchMyActiveDispatch();
      if (server) {
        setActive(server);
        await setStoredActiveDispatch(server);
      } else {
        setActive(null);
        await setStoredActiveDispatch(null);
      }
    } catch {
      // If offline or API down, keep whatever is currently in memory.
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const stored = await getStoredActiveDispatch();
      if (alive) setActive(stored);
      setLoading(false);
      // always sync with server on start
      await refresh();
    })();

    return () => {
      alive = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (pollMs <= 0) return;
    timerRef.current = setInterval(() => {
      refresh();
    }, pollMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [pollMs, refresh]);

  const clear = useCallback(async () => {
    setActive(null);
    await setStoredActiveDispatch(null);
  }, []);

  return { activeDispatch: active, loading, refresh, clear };
}
