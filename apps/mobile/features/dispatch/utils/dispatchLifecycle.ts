import type { DispatchOffer } from "../models/dispatch";

function toEpoch(value?: string | null) {
  if (!value) return Number.NaN;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : Number.NaN;
}

export function isPendingDispatchActive(dispatch: DispatchOffer | null | undefined, nowMs = Date.now()) {
  if (!dispatch || dispatch.status !== "PENDING") return false;
  const expiresAt = toEpoch(dispatch.expiresAt);
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt > nowMs;
}

export function pendingDispatchExpirationMs(dispatch: DispatchOffer | null | undefined) {
  if (!dispatch || dispatch.status !== "PENDING") return null;
  const expiresAt = toEpoch(dispatch.expiresAt);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}
