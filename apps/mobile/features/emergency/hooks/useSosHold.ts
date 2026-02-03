import { useCallback, useEffect, useRef, useState } from "react";

type UseSosHoldOptions = {
  holdMs?: number;
  onTriggered: () => void | Promise<void>;
};

export function useSosHold({ holdMs = 3000, onTriggered }: UseSosHoldOptions) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const startHold = useCallback(() => {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      void onTriggered(); // supports async without unhandled promise warnings
    }, holdMs);
  }, [holdMs, onTriggered]);

  const cancelHold = useCallback(() => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  return { holding, startHold, cancelHold };
}
