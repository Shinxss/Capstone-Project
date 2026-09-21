import type { DispatchTask } from "../../../tasks/models/tasks.types";

export type ResponderDispatchState = "available" | "awaiting_response" | "assigned";

function toEpoch(value?: string | null) {
  if (!value) return Number.NaN;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : Number.NaN;
}

export function isPendingOfferActive(task: DispatchTask, nowMs = Date.now()) {
  if (task.status !== "PENDING") return false;
  const expiresAt = toEpoch(task.expiresAt);

  // During a staggered deployment, an older API may omit expiresAt. Keep the
  // offer blocking until the authoritative backend supplies its expiration.
  if (!Number.isFinite(expiresAt)) return true;
  return expiresAt > nowMs;
}

export function getResponderDispatchState(task: DispatchTask, nowMs = Date.now()): ResponderDispatchState {
  if (task.status === "ACCEPTED" || task.status === "DONE") return "assigned";
  if (isPendingOfferActive(task, nowMs)) return "awaiting_response";
  return "available";
}

export function responderDispatchStates(tasks: DispatchTask[], nowMs = Date.now()) {
  const states = new Map<string, ResponderDispatchState>();

  for (const task of tasks) {
    const responderId = String(task.volunteer?.id ?? "").trim();
    if (!responderId) continue;

    const nextState = getResponderDispatchState(task, nowMs);
    const currentState = states.get(responderId) ?? "available";
    if (nextState === "assigned" || (nextState === "awaiting_response" && currentState === "available")) {
      states.set(responderId, nextState);
    }
  }

  return states;
}

export function blockingResponderIds(tasks: DispatchTask[], nowMs = Date.now()) {
  return new Set(
    [...responderDispatchStates(tasks, nowMs)]
      .filter(([, state]) => state !== "available")
      .map(([responderId]) => responderId),
  );
}

export function nextPendingOfferExpirationMs(tasks: DispatchTask[], nowMs = Date.now()) {
  const expirations = tasks
    .filter((task) => task.status === "PENDING")
    .map((task) => toEpoch(task.expiresAt))
    .filter((expiresAt) => Number.isFinite(expiresAt) && expiresAt > nowMs);

  return expirations.length > 0 ? Math.min(...expirations) : null;
}
