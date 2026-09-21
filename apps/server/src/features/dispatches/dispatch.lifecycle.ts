import { DISPATCH_PENDING_RESPONSE_TIMEOUT_MS } from "./dispatch.constants";
import type { DispatchStatus } from "./dispatch.model";

export const BLOCKING_DISPATCH_STATUSES: readonly DispatchStatus[] = [
  "PENDING",
  "ACCEPTED",
  "DONE",
];

export type DispatchLifecycleRecord = {
  status?: string | null;
  createdAt?: Date | string | null;
  expiresAt?: Date | string | null;
};

function toEpoch(value: Date | string | null | undefined) {
  if (!value) return Number.NaN;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : Number.NaN;
}

export function getDispatchOfferExpiresAt(
  offer: Pick<DispatchLifecycleRecord, "createdAt" | "expiresAt">,
): Date | null {
  const explicitExpiry = toEpoch(offer.expiresAt);
  if (Number.isFinite(explicitExpiry)) return new Date(explicitExpiry);

  const createdAt = toEpoch(offer.createdAt);
  if (!Number.isFinite(createdAt)) return null;
  return new Date(createdAt + DISPATCH_PENDING_RESPONSE_TIMEOUT_MS);
}

export function isPendingOfferActive(offer: DispatchLifecycleRecord, nowMs = Date.now()) {
  if (String(offer.status ?? "").toUpperCase() !== "PENDING") return false;
  const expiresAt = getDispatchOfferExpiresAt(offer)?.getTime() ?? Number.NaN;
  return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

export function isResponderBlockingDispatch(offer: DispatchLifecycleRecord, nowMs = Date.now()) {
  const status = String(offer.status ?? "").toUpperCase() as DispatchStatus;
  if (status === "PENDING") return isPendingOfferActive(offer, nowMs);
  return status === "ACCEPTED" || status === "DONE";
}

export function activePendingOfferFilter(now = new Date()) {
  const cutoff = new Date(now.getTime() - DISPATCH_PENDING_RESPONSE_TIMEOUT_MS);
  return {
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: { $exists: false }, createdAt: { $gt: cutoff } },
      { expiresAt: null, createdAt: { $gt: cutoff } },
    ],
  };
}

export function expiredPendingOfferFilter(now = new Date()) {
  const cutoff = new Date(now.getTime() - DISPATCH_PENDING_RESPONSE_TIMEOUT_MS);
  return {
    $or: [
      { expiresAt: { $lte: now } },
      { expiresAt: { $exists: false }, createdAt: { $lte: cutoff } },
      { expiresAt: null, createdAt: { $lte: cutoff } },
    ],
  };
}
