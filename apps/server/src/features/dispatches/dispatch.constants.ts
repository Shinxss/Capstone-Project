const DEFAULT_PENDING_RESPONSE_TIMEOUT_MS = 5 * 60_000;

function parsePositiveMs(raw: unknown, fallback: number) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export const DISPATCH_PENDING_RESPONSE_TIMEOUT_MS = parsePositiveMs(
  process.env.DISPATCH_PENDING_RESPONSE_TIMEOUT_MS,
  DEFAULT_PENDING_RESPONSE_TIMEOUT_MS
);

export function getDispatchPendingResponseCutoffDate(nowMs = Date.now()) {
  return new Date(nowMs - DISPATCH_PENDING_RESPONSE_TIMEOUT_MS);
}
