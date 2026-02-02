import { useCallback, useRef, useState } from "react";

type UseSosHoldOptions = {
  holdMs?: number;
  onTriggered: () => void;
};

export function useSosHold({ holdMs = 3000, onTriggered }: UseSosHoldOptions) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const startHold = useCallback(() => {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      onTriggered();
    }, holdMs);
  }, [holdMs, onTriggered]);

  const cancelHold = useCallback(() => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  return { holding, startHold, cancelHold };
}
