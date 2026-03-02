import type { TrackingLabel } from "../models/myRequests";

export function formatRelativeTime(iso?: string | null, nowMs = Date.now()): string {
  if (!iso) return "just now";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "just now";

  const diffSeconds = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatEtaText(
  etaSeconds: number | null | undefined,
  trackingLabel: TrackingLabel
): string {
  if (typeof etaSeconds === "number" && Number.isFinite(etaSeconds) && etaSeconds >= 0) {
    const arrival = new Date(Date.now() + etaSeconds * 1000).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const minutes = Math.max(1, Math.round(etaSeconds / 60));
    return `ETA: ${arrival} (${minutes} min${minutes === 1 ? "" : "s"})`;
  }

  if (trackingLabel === "Submitted" || trackingLabel === "Assigned") {
    return "Waiting for responder...";
  }
  if (trackingLabel === "En Route") {
    return "ETA: calculating...";
  }
  if (trackingLabel === "Arrived") {
    return "Responder has arrived.";
  }
  if (trackingLabel === "Resolved") {
    return "Request resolved.";
  }
  if (trackingLabel === "Cancelled") {
    return "Request cancelled.";
  }

  return "ETA: calculating...";
}

export function formatTrackingHeadline(label: TrackingLabel): string {
  if (label === "Submitted") return "Request Submitted";
  if (label === "Assigned") return "Responder Assigned";
  if (label === "En Route") return "Responder En Route";
  if (label === "Arrived") return "Responder Arrived";
  if (label === "Resolved") return "Request Resolved";
  return "Request Cancelled";
}
