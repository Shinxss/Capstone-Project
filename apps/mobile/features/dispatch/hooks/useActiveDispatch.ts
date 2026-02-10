import { useCallback, useEffect, useState } from "react";
import type { DispatchOffer } from "../models/dispatch.types";
import { getActiveDispatch, setActiveDispatch } from "../services/dispatchStorage";

export function useActiveDispatch() {
  const [active, setActive] = useState<DispatchOffer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const offer = await getActiveDispatch();
    setActive(offer);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const set = useCallback(async (offer: DispatchOffer | null) => {
    await setActiveDispatch(offer);
    setActive(offer);
  }, []);

  return { active, loading, refresh, set };
}
