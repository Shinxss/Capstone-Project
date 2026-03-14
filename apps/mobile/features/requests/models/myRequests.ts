export type MyRequestStatusTab =
  | "all"
  | "submitted"
  | "verification"
  | "assigned"
  | "en_route"
  | "arrived"
  | "review"
  | "resolved"
  | "cancelled";

export const MY_REQUEST_STATUS_TABS: MyRequestStatusTab[] = [
  "all",
  "submitted",
  "verification",
  "assigned",
  "en_route",
  "arrived",
  "review",
  "resolved",
  "cancelled",
];

export const MY_REQUEST_TAB_LABELS: Record<MyRequestStatusTab, string> = {
  all: "All",
  submitted: "Submitted",
  verification: "Verification",
  assigned: "Assigned",
  en_route: "En Route",
  arrived: "Arrived",
  review: "Review",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export type TrackingLabel =
  | "Submitted"
  | "Verification"
  | "Assigned"
  | "En Route"
  | "Arrived"
  | "Review"
  | "Resolved"
  | "Cancelled";

export type MyRequestScope = "active" | "history";

export type MyRequestSummary = {
  id: string;
  referenceNumber: string;
  type: string;
  trackingLabel: TrackingLabel;
  trackingStatus: TrackingLabel;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  locationText: string;
  etaSeconds?: number | null;
  location: {
    lng: number;
    lat: number;
  };
  lastUpdatedAt?: string | null;
};

export type MyRequestCountsByStatus = {
  assigned: number;
  en_route: number;
  arrived: number;
  resolved: number;
};

export type TrackingTimeline = {
  steps: Array<"Submitted" | "Assigned" | "En Route" | "Arrived" | "Resolved">;
  activeStepIndex: number;
};

export type MyRequestTrackingDTO = {
  request: {
    id: string;
    referenceNumber: string;
    type: string;
    createdAt: string;
    status: string;
    rejectionReason?: string;
    location: {
      lng: number;
      lat: number;
    };
    locationText: string;
    barangay?: string;
    notes?: string;
  };
  timeline: TrackingTimeline;
  tracking: {
    label: TrackingLabel;
    etaSeconds: number | null;
    lastUpdatedAt: string;
    responder?: {
      id: string;
      name: string;
      phone?: string;
    };
    responderLocation?: {
      lng: number;
      lat: number;
      at: string;
    };
    routeGeometry?: {
      type: "LineString";
      coordinates: [number, number][];
    } | null;
  };
};

export function normalizeMyRequestStatusTab(
  raw: unknown,
  fallback: MyRequestStatusTab = "all"
): MyRequestStatusTab {
  const normalized = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace("-", "_");
  if (normalized === "canceled" || normalized === "rejected") {
    return "cancelled";
  }
  if (MY_REQUEST_STATUS_TABS.includes(normalized as MyRequestStatusTab)) {
    return normalized as MyRequestStatusTab;
  }
  return fallback;
}

export function toMyRequestStatusTabFromLabel(label: unknown): Exclude<MyRequestStatusTab, "all"> {
  const normalized = String(label ?? "").trim().toLowerCase();
  if (normalized === "submitted") return "submitted";
  if (normalized === "verification") return "verification";
  if (normalized === "assigned") return "assigned";
  if (normalized === "en route") return "en_route";
  if (normalized === "arrived") return "arrived";
  if (normalized === "review") return "review";
  if (normalized === "resolved") return "resolved";
  if (normalized === "cancelled" || normalized === "canceled" || normalized === "rejected") {
    return "cancelled";
  }
  return "submitted";
}
