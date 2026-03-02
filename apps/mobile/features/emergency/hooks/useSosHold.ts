import { useCallback, useEffect, useRef, useState } from "react";

type UseSosHoldOptions = {
  holdMs?: number;
  onTriggered: () => void | Promise<void>;
};

export function useSosHold({ holdMs = 3000, onTriggered }: UseSosHoldOptions) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtMs = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [remainingMs, setRemainingMs] = useState(holdMs);
  const [progress, setProgress] = useState(0);

  const clearTimers = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    holdTimer.current = null;
    tickTimer.current = null;
    startedAtMs.current = null;
  }, []);

  const startHold = useCallback(() => {
    if (holdTimer.current) return;

    startedAtMs.current = Date.now();
    setHolding(true);
    setRemainingMs(holdMs);
    setProgress(0);

    tickTimer.current = setInterval(() => {
      const startedAt = startedAtMs.current ?? Date.now();
      const elapsed = Math.max(0, Date.now() - startedAt);
      const nextRemaining = Math.max(holdMs - elapsed, 0);

      setRemainingMs(nextRemaining);
      setProgress(Math.min(elapsed / holdMs, 1));
    }, 50);

    holdTimer.current = setTimeout(() => {
      clearTimers();
      setHolding(false);
      setRemainingMs(0);
      setProgress(1);
      void onTriggered(); // supports async without unhandled promise warnings
    }, holdMs);
  }, [clearTimers, holdMs, onTriggered]);

  const cancelHold = useCallback(() => {
    clearTimers();
    setHolding(false);
    setRemainingMs(holdMs);
    setProgress(0);
  }, [clearTimers, holdMs]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const remainingSeconds = holding
    ? Math.max(1, Math.ceil(remainingMs / 1000))
    : Math.ceil(holdMs / 1000);

  return { holding, progress, remainingMs, remainingSeconds, startHold, cancelHold };
}
