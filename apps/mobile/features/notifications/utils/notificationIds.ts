export function getRequestUpdateNotificationId(
  requestId: unknown,
  step: unknown,
  fallbackId?: string
) {
  const normalizedRequestId = String(requestId ?? "").trim() || fallbackId || "unknown";
  const normalizedStep = String(step ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ") || "UNKNOWN";

  return `request-update:${normalizedRequestId}:${normalizedStep}`;
}
