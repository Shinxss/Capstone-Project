import { useCallback, useEffect, useRef, useState } from "react";
import type { DispatchOffer } from "../models/dispatch.types";
import { getMyPendingDispatch } from "../services/dispatchApi";

type Options = {
  enabled: boolean;
  pollMs?: number;
};

export function usePendingDispatch(opts: Options) {
  const { enabled, pollMs = 5000 } = opts;

  const [pending, setPending] = useState<DispatchOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const inflightRef = useRef(false);

  const fetchNow = useCallback(async () => {
    if (!enabled) return;
    if (inflightRef.current) return;
    inflightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const offer = await getMyPendingDispatch();
      setPending(offer);
    } catch (e: any) {
      // if volunteer isn't authorized, don't spam UI
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to fetch dispatch");
    } finally {
      setLoading(false);
      inflightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPending(null);
      setError(null);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    fetchNow();
    timerRef.current = setInterval(fetchNow, pollMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, pollMs, fetchNow]);

  return { pending, loading, error, refetch: fetchNow, clear: () => setPending(null) };
}
