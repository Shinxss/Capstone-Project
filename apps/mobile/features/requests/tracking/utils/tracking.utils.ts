import type { TrackingLabel } from "../../models/myRequests";

export function normalizeTrackingLabel(raw: unknown): TrackingLabel {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "verification") return "Verification";
  if (value === "assigned") return "Assigned";
  if (value === "en route") return "En Route";
  if (value === "arrived") return "Arrived";
  if (value === "review") return "Review";
  if (value === "resolved") return "Resolved";
  if (value === "cancelled" || value === "canceled" || value === "rejected") return "Cancelled";
  return "Submitted";
}

export function trackingCompletionPercent(activeIndex: number, count: number) { if (count <= 1) return 0; const safe = Math.max(0, Math.min(count - 1, Math.round(activeIndex))); return Math.round((safe / (count - 1)) * 100); }
export function formatTrackingDate(iso?: string | null) { if (!iso) return "—"; const date = new Date(iso); if (Number.isNaN(date.getTime())) return "—"; return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); }
export function formatRequestType(raw?: string | null) { const value = String(raw ?? "").trim().toLowerCase(); if (!value) return "Emergency"; if (value === "sos" || value === "sos emergency") return "SOS"; return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
export function toCoordinate(point?: { lng: number; lat: number } | null): [number, number] | null { if (!point || !Number.isFinite(point.lng) || !Number.isFinite(point.lat)) return null; return [point.lng, point.lat]; }
export function responderInitials(name?: string | null) { return String(name ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "R"; }
export function isClosedTrackingStatus(label: TrackingLabel) { return label === "Resolved" || label === "Cancelled"; }
