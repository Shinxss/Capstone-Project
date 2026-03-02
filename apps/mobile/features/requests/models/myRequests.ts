export type TrackingLabel =
  | "Submitted"
  | "Assigned"
  | "En Route"
  | "Arrived"
  | "Resolved"
  | "Cancelled";

export type MyRequestScope = "active" | "history";

export type MyRequestSummary = {
  id: string;
  referenceNumber: string;
  type: string;
  status: string;
  createdAt: string;
  location: {
    lng: number;
    lat: number;
  };
  trackingStatus: TrackingLabel;
  etaSeconds?: number | null;
  lastUpdatedAt?: string | null;
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
    location: {
      lng: number;
      lat: number;
    };
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
