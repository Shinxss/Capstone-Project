import { useCallback, useEffect, useRef, useState } from "react";
import type { DispatchOffer } from "../models/dispatch";
import { fetchMyActiveDispatch } from "../services/dispatchApi";
import { getStoredActiveDispatch, setStoredActiveDispatch } from "../services/dispatchStorage";

export function useActiveDispatch(options?: { pollMs?: number; enabled?: boolean }) {
  const pollMs = options?.pollMs ?? 8000;
  const enabled = options?.enabled ?? true;
  const [active, setActive] = useState<DispatchOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<any>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActive(null);
      await setStoredActiveDispatch(null);
      return;
    }

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
  }, [enabled]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      if (!enabled) {
        setActive(null);
        await setStoredActiveDispatch(null);
        if (alive) setLoading(false);
        return;
      }

      const stored = await getStoredActiveDispatch();
      if (alive) setActive(stored);
      setLoading(false);
      // always sync with server on start
      await refresh();
    })();

    return () => {
      alive = false;
    };
  }, [enabled, refresh]);

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
  }, [enabled, pollMs, refresh]);

  const clear = useCallback(async () => {
    setActive(null);
    await setStoredActiveDispatch(null);
  }, []);

  return { activeDispatch: active, loading, refresh, clear };
}
