import { useCallback, useEffect, useState } from "react";
import { markGuestSosUsed, readGuestSosUsed } from "../services/guestSosStorage";

type UseGuestSosLimitOptions = {
  enabled: boolean;
};

export function useGuestSosLimit(options: UseGuestSosLimitOptions) {
  const { enabled } = options;
  const [loaded, setLoaded] = useState(!enabled);
  const [used, setUsed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoaded(true);
      setUsed(false);
      return;
    }

    let alive = true;
    setLoaded(false);

    void (async () => {
      try {
        const alreadyUsed = await readGuestSosUsed();
        if (!alive) return;
        setUsed(alreadyUsed);
      } catch {
        if (!alive) return;
        setUsed(false);
      } finally {
        if (alive) setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled]);

  const saveUsed = useCallback(async () => {
    setUsed(true);
    await markGuestSosUsed();
  }, []);

  return {
    loaded,
    used,
    saveUsed,
  };
}
