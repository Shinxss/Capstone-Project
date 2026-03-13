import { Types, isValidObjectId } from "mongoose";
import {
  EmergencyReportModel,
  type EmergencyReportDocument,
  type IEmergencyReport,
} from "../models/EmergencyReport.model";
import type { CreateEmergencyReportInput, MyRequestStatusTab } from "../schemas/emergencyReport.schema";
import {
  MAX_REFERENCE_ATTEMPTS,
  generateReferenceNumberCandidate,
} from "../utils/referenceNumber";
import type { VerificationStatus } from "../emergency.model";
import { findBarangayByPoint } from "../../barangays/barangay.service";
import { DispatchOffer } from "../../dispatches/dispatch.model";

const EMERGENCY_REPORT_PHOTO_URL_PREFIX = "/uploads/emergency-report-photos/";

type PublicEmergencyReport = {
  referenceNumber: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "cancelled";
  type: CreateEmergencyReportInput["type"];
  createdAt: Date;
};

export type CreateEmergencyReportResult = {
  incidentId: string;
  referenceNumber: string;
  isSos: boolean;
  verificationStatus: VerificationStatus;
  isVisibleOnMap: boolean;
  createdAt: Date;
  location: {
    coords: {
      latitude: number;
      longitude: number;
    };
    label?: string;
  };
};

export type MapEmergencyReport = {
  incidentId: string;
  referenceNumber: string;
  isSos: boolean;
  type: string;
  status: PublicEmergencyReport["status"];
  verificationStatus: VerificationStatus;
  isVisibleOnMap: boolean;
  createdAt: Date;
  location: {
    coords: {
      latitude: number;
      longitude: number;
    };
    label?: string;
  };
  description?: string;
};

export type PendingApprovalItem = {
  incidentId: string;
  referenceNumber: string;
  type: string;
  barangay: string;
  locationLabel?: string;
  createdAt: Date;
  reporter: {
    id?: string;
    name: string;
    role?: string;
    isGuest: boolean;
  };
};

const MAPBOX_DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5/mapbox";
const TRACKING_TIMELINE_STEPS = ["Submitted", "Assigned", "En Route", "Arrived", "Resolved"] as const;
const MY_REQUEST_LIST_LABELS = [
  "Submitted",
  "Verification",
  "Assigned",
  "En Route",
  "Arrived",
  "Resolved",
  "Review",
  "Cancelled",
] as const;

type TrackingTimelineStep = (typeof TRACKING_TIMELINE_STEPS)[number];
export type TrackingLabel = TrackingTimelineStep | "Cancelled";
export type MyRequestListTrackingLabel = (typeof MY_REQUEST_LIST_LABELS)[number];
type MappedMyRequestStatusTab = Exclude<MyRequestStatusTab, "all" | "review">;
type LegacyScope = "active" | "history";

type LocationPoint = {
  lng: number;
  lat: number;
};

type LineStringRouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type MyRequestSummary = {
  id: string;
  referenceNumber: string;
  type: CreateEmergencyReportInput["type"];
  status: IEmergencyReport["status"];
  createdAt: string;
  location: LocationPoint;
  locationText: string;
  trackingLabel: MyRequestListTrackingLabel;
  trackingStatus: MyRequestListTrackingLabel;
  etaSeconds?: number | null;
  lastUpdatedAt?: string | null;
};

export type MyRequestCountSummary = {
  assigned: number;
  en_route: number;
  arrived: number;
  resolved: number;
};

export type MyRequestTrackingDTO = {
  request: {
    id: string;
    referenceNumber: string;
    type: CreateEmergencyReportInput["type"];
    createdAt: string;
    status: IEmergencyReport["status"];
    location: LocationPoint;
    notes?: string;
  };
  timeline: {
    steps: TrackingTimelineStep[];
    activeStepIndex: number;
  };
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
    routeGeometry?: LineStringRouteGeometry | null;
  };
};

function toDbEmergencyType(type: CreateEmergencyReportInput["type"]): IEmergencyReport["emergencyType"] {
  switch (type) {
    case "fire":
      return "FIRE";
    case "flood":
      return "FLOOD";
    case "typhoon":
      return "TYPHOON";
    case "earthquake":
      return "EARTHQUAKE";
    case "collapse":
      return "COLLAPSE";
    case "medical":
      return "MEDICAL";
    default:
      return "OTHER";
  }
}

function fromDbEmergencyType(type: IEmergencyReport["emergencyType"]): CreateEmergencyReportInput["type"] {
  switch (type) {
    case "FIRE":
      return "fire";
    case "FLOOD":
      return "flood";
    case "TYPHOON":
      return "typhoon";
    case "EARTHQUAKE":
      return "earthquake";
    case "COLLAPSE":
      return "collapse";
    case "MEDICAL":
      return "medical";
    default:
      return "other";
  }
}

function fromDbEmergencyStatus(status: IEmergencyReport["status"]): PublicEmergencyReport["status"] {
  switch (status) {
    case "RESOLVED":
      return "resolved";
    case "CANCELLED":
      return "cancelled";
    case "ACKNOWLEDGED":
      return "assigned";
    default:
      return "open";
  }
}

function toIsoString(value: unknown, fallback = new Date()) {
  const d = value instanceof Date ? value : new Date(String(value ?? ""));
  if (Number.isNaN(d.getTime())) return fallback.toISOString();
  return d.toISOString();
}

function toPointCoordinates(coords: unknown): LocationPoint | null {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

function toLineStringRouteGeometry(raw: unknown): LineStringRouteGeometry | null {
  if (!raw || typeof raw !== "object") return null;
  const geometry = raw as { type?: unknown; coordinates?: unknown };
  if (geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) return null;

  const coords: [number, number][] = [];
  for (const point of geometry.coordinates) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    coords.push([lng, lat]);
  }

  if (coords.length < 2) return null;
  return { type: "LineString", coordinates: coords };
}

function hasOfferStatus(offers: any[], status: string) {
  const target = status.trim().toUpperCase();
  return offers.some((offer) => String(offer?.status ?? "").trim().toUpperCase() === target);
}

function pickRelevantOffer(offers: any[]) {
  if (!Array.isArray(offers) || offers.length === 0) return null;
  const prioritized = offers.filter((offer) => {
    const status = String(offer?.status ?? "").trim().toUpperCase();
    return status === "ACCEPTED" || status === "DONE" || status === "VERIFIED";
  });
  return prioritized[0] ?? offers[0];
}

function pickResponderOffer(offers: any[]) {
  if (!Array.isArray(offers) || offers.length === 0) return null;
  return (
    offers.find((offer) => {
      const status = String(offer?.status ?? "").trim().toUpperCase();
      return status === "PENDING" || status === "ACCEPTED" || status === "DONE" || status === "VERIFIED";
    }) ?? null
  );
}

function deriveTrackingLabel(
  emergencyStatusRaw: unknown,
  offers: any[]
): TrackingLabel {
  const emergencyStatus = String(emergencyStatusRaw ?? "").trim().toUpperCase();

  if (emergencyStatus === "CANCELLED") return "Cancelled";
  if (emergencyStatus === "RESOLVED" || hasOfferStatus(offers, "VERIFIED")) return "Resolved";
  if (hasOfferStatus(offers, "DONE")) return "Arrived";
  if (hasOfferStatus(offers, "ACCEPTED")) return "En Route";
  if (offers.length > 0) return "Assigned";
  return "Submitted";
}

const MY_REQUEST_TRACKING_LABEL_BY_TAB: Record<MappedMyRequestStatusTab, MyRequestListTrackingLabel> = {
  submitted: "Submitted",
  verification: "Verification",
  assigned: "Assigned",
  en_route: "En Route",
  arrived: "Arrived",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

function deriveMyRequestStatusTab(report: any, offers: any[]): MappedMyRequestStatusTab {
  const emergencyStatus = String(report?.status ?? "").trim().toUpperCase();
  const verificationStatus = String(report?.verification?.status ?? "").trim().toLowerCase();

  if (emergencyStatus === "CANCELLED" || verificationStatus === "rejected") {
    return "cancelled";
  }
  if (emergencyStatus === "RESOLVED" || hasOfferStatus(offers, "VERIFIED")) {
    return "resolved";
  }
  if (hasOfferStatus(offers, "DONE")) {
    return "arrived";
  }
  if (hasOfferStatus(offers, "ACCEPTED")) {
    return "en_route";
  }
  if (offers.length > 0) {
    return "assigned";
  }
  if (!Boolean(report?.isSos) && (verificationStatus === "pending" || verificationStatus === "approved")) {
    return "verification";
  }
  return "submitted";
}

function toMyRequestTrackingLabel(
  tab: MappedMyRequestStatusTab,
  requestedTab?: MyRequestStatusTab
): MyRequestListTrackingLabel {
  if (requestedTab === "review" && tab === "resolved") {
    return "Review";
  }
  return MY_REQUEST_TRACKING_LABEL_BY_TAB[tab];
}

function getRequestFlowRank(label: MyRequestListTrackingLabel) {
  switch (label) {
    case "Submitted":
      return 0;
    case "Verification":
      return 1;
    case "Assigned":
      return 2;
    case "En Route":
      return 3;
    case "Arrived":
      return 4;
    case "Resolved":
      return 5;
    case "Review":
      return 6;
    case "Cancelled":
      return 7;
    default:
      return 999;
  }
}

function matchesMyRequestFilter(
  tab: MappedMyRequestStatusTab,
  options?: { tab?: MyRequestStatusTab; scope?: LegacyScope }
) {
  if (options?.tab) {
    if (options.tab === "all") return true;
    if (options.tab === "review") return tab === "resolved";
    return tab === options.tab;
  }

  if (options?.scope === "active") {
    return tab !== "resolved" && tab !== "cancelled";
  }
  if (options?.scope === "history") {
    return tab === "resolved" || tab === "cancelled";
  }

  return true;
}

function toLocationText(report: any, location: LocationPoint | null) {
  const label = String(report?.locationLabel ?? "").trim();
  if (label) return label;
  if (!location) return "Location unavailable";
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

function toTimelineActiveStepIndex(
  label: TrackingLabel,
  emergencyStatusRaw: unknown,
  offers: any[]
) {
  if (label === "Cancelled") {
    const emergencyStatus = String(emergencyStatusRaw ?? "").trim().toUpperCase();
    if (emergencyStatus === "RESOLVED" || hasOfferStatus(offers, "VERIFIED")) return 4;
    if (hasOfferStatus(offers, "DONE")) return 3;
    if (hasOfferStatus(offers, "ACCEPTED")) return 2;
    if (offers.length > 0) return 1;
    return 0;
  }

  if (label === "Resolved") return 4;
  if (label === "Arrived") return 3;
  if (label === "En Route") return 2;
  if (label === "Assigned") return 1;
  return 0;
}

function toResponderName(offer: any) {
  const volunteer = offer?.volunteerId;
  if (!volunteer) return "";
  const firstName = String(volunteer?.firstName ?? "").trim();
  const lastName = String(volunteer?.lastName ?? "").trim();
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || "Assigned responder";
}

async function fetchResponderEtaAndRoute(
  start: LocationPoint,
  destination: LocationPoint
): Promise<{ etaSeconds: number | null; routeGeometry: LineStringRouteGeometry | null }> {
  const token = process.env.MAPBOX_TOKEN?.trim();
  if (!token) return { etaSeconds: null, routeGeometry: null };

  const coordsPath = `${start.lng},${start.lat};${destination.lng},${destination.lat}`;
  const url = new URL(`${MAPBOX_DIRECTIONS_BASE}/driving/${coordsPath}`);
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return { etaSeconds: null, routeGeometry: null };
    }

    const payload = (await response.json()) as {
      routes?: Array<{ duration?: unknown; geometry?: unknown }>;
    };
    const route = Array.isArray(payload.routes) ? payload.routes[0] : null;
    if (!route) return { etaSeconds: null, routeGeometry: null };

    const duration = Number(route.duration);
    const etaSeconds = Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : null;
    const routeGeometry = toLineStringRouteGeometry(route.geometry);
    return { etaSeconds, routeGeometry };
  } catch {
    return { etaSeconds: null, routeGeometry: null };
  }
}

async function buildMyRequestSummaryFromReport(
  report: any,
  offers: any[],
  options?: {
    includeEta?: boolean;
    requestedTab?: MyRequestStatusTab;
    mappedTab?: MappedMyRequestStatusTab;
  }
): Promise<MyRequestSummary> {
  const includeEta = options?.includeEta === true;
  const mappedTab = options?.mappedTab ?? deriveMyRequestStatusTab(report, offers);
  const location = toPointCoordinates(report?.location?.coordinates);
  const safeLocation = location ?? { lng: 0, lat: 0 };
  const label = toMyRequestTrackingLabel(mappedTab, options?.requestedTab);
  const relevantOffer = pickRelevantOffer(offers);
  const responderOffer = pickResponderOffer(offers);
  const locationOffer = pickRelevantOffer(offers) ?? responderOffer;
  const responderLocation = toPointCoordinates(locationOffer?.lastKnownLocation?.coordinates);
  const etaPayload =
    includeEta && mappedTab === "en_route" && responderLocation
      ? await fetchResponderEtaAndRoute(responderLocation, safeLocation)
      : null;

  const lastUpdatedAt =
    relevantOffer?.lastKnownLocationAt ??
    relevantOffer?.updatedAt ??
    report?.updatedAt ??
    report?.createdAt ??
    new Date();

  return {
    id: String(report?._id ?? ""),
    referenceNumber: String(report?.referenceNumber ?? ""),
    type: fromDbEmergencyType(report?.emergencyType ?? "OTHER"),
    status: (String(report?.status ?? "OPEN").toUpperCase() as IEmergencyReport["status"]),
    createdAt: toIsoString(report?.createdAt),
    location: safeLocation,
    locationText: toLocationText(report, location),
    trackingLabel: label,
    trackingStatus: label,
    etaSeconds: includeEta && mappedTab === "en_route" ? (etaPayload?.etaSeconds ?? null) : null,
    lastUpdatedAt: toIsoString(lastUpdatedAt),
  };
}

function sanitizeEmergencyPhotoUrls(photoUrls?: string[]) {
  const normalized = Array.isArray(photoUrls)
    ? photoUrls.map((photoUrl) => String(photoUrl ?? "").trim()).filter(Boolean)
    : [];

  const sanitized = normalized.filter((photoUrl) =>
    photoUrl.startsWith(EMERGENCY_REPORT_PHOTO_URL_PREFIX)
  );

  if (sanitized.length !== normalized.length) {
    throw new Error("Invalid photo URL");
  }

  return sanitized.slice(0, 5);
}

export async function createEmergencyReport(
  input: CreateEmergencyReportInput,
  reporterUserId?: string
): Promise<CreateEmergencyReportResult> {
  const sanitizedPhotos = sanitizeEmergencyPhotoUrls(input.photos);
  if (!input.isSos && sanitizedPhotos.length < 3) {
    throw new Error("At least 3 proof images are required.");
  }

  let locationLabel = String(input.location.label ?? "").trim() || undefined;
  if (input.isSos && !locationLabel) {
    const lng = Number(input.location.coords.longitude);
    const lat = Number(input.location.coords.latitude);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      const found = await findBarangayByPoint(lng, lat, {
        city: "Dagupan City",
        province: "Pangasinan",
      });
      if (found) {
        locationLabel = [found.name, found.city, found.province].filter(Boolean).join(", ") || undefined;
      }
    }
  }

  let report: EmergencyReportDocument | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    try {
      const referenceNumber = generateReferenceNumberCandidate();
      const verificationStatus: VerificationStatus = input.isSos ? "not_required" : "pending";
      const isVisibleOnMap = input.isSos;

      report = await EmergencyReportModel.create({
        isSos: input.isSos,
        emergencyType: input.isSos ? "SOS" : toDbEmergencyType(input.type),
        source: input.isSos ? "SOS_BUTTON" : "REPORT_FORM",
        status: "OPEN",
        verification: {
          status: verificationStatus,
        },
        visibility: {
          isVisibleOnMap,
        },
        location: {
          type: "Point",
          coordinates: [input.location.coords.longitude, input.location.coords.latitude],
        },
        locationLabel,
        notes: input.description,
        photos: sanitizedPhotos,
        ...(reporterUserId ? { reportedBy: reporterUserId } : {}),
        reporterIsGuest: !reporterUserId,
        reportedAt: new Date(),
        referenceNumber,
      });

      break;
    } catch (error: any) {
      lastError = error;
      if (error?.code === 11000 && String(error?.message ?? "").includes("referenceNumber")) {
        continue;
      }

      throw error;
    }
  }

  if (!report) {
    throw new Error((lastError as any)?.message ?? "Failed to generate unique reference number");
  }

  return {
    incidentId: report._id.toString(),
    referenceNumber: String(report.referenceNumber ?? ""),
    isSos: Boolean(report.isSos),
    verificationStatus: report.verification?.status ?? (report.isSos ? "not_required" : "pending"),
    isVisibleOnMap: Boolean(report.visibility?.isVisibleOnMap),
    location: {
      coords: {
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
      },
      label: report.locationLabel,
    },
    createdAt: report.createdAt ?? new Date(),
  };
}

export async function getEmergencyReportById(id: string) {
  if (!isValidObjectId(id)) return null;

  const report = await EmergencyReportModel.findById(id)
    .select(
      "isSos referenceNumber emergencyType status verification visibility location locationLabel notes photos reportedBy reporterIsGuest reportedAt createdAt updatedAt"
    )
    .populate("reportedBy", "firstName lastName contactNo barangay municipality country postalCode")
    .lean();

  if (!report) return null;

  const reporterRaw = report.reportedBy;
  const reporter =
    reporterRaw && typeof reporterRaw === "object"
      ? {
          isGuest: Boolean(report.reporterIsGuest),
          firstName: String((reporterRaw as any).firstName ?? "").trim() || undefined,
          lastName: String((reporterRaw as any).lastName ?? "").trim() || undefined,
          contactNo: String((reporterRaw as any).contactNo ?? "").trim() || undefined,
          barangay: String((reporterRaw as any).barangay ?? "").trim() || undefined,
          municipality: String((reporterRaw as any).municipality ?? "").trim() || undefined,
          country: String((reporterRaw as any).country ?? "").trim() || undefined,
          postalCode: String((reporterRaw as any).postalCode ?? "").trim() || undefined,
        }
      : {
          isGuest: Boolean(report.reporterIsGuest) || !reporterRaw,
        };

  return {
    incidentId: report._id.toString(),
    referenceNumber: String(report.referenceNumber ?? ""),
    isSos: Boolean(report.isSos),
    type: fromDbEmergencyType(report.emergencyType),
    status: fromDbEmergencyStatus(report.status),
    verificationStatus: report.verification?.status ?? (report.isSos ? "not_required" : "pending"),
    isVisibleOnMap: Boolean(report.visibility?.isVisibleOnMap),
    location: {
      coords: {
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
      },
      label: report.locationLabel,
    },
    description: report.notes,
    photos: report.photos ?? [],
    reporter,
    reportedAt: report.reportedAt ?? report.createdAt ?? new Date(),
    createdAt: report.createdAt ?? new Date(),
    updatedAt: report.updatedAt ?? new Date(),
  };
}

export async function getEmergencyReportByReference(
  referenceNumber: string,
  includePrivate = false
): Promise<PublicEmergencyReport | null> {
  const selectFields = includePrivate
    ? "isSos referenceNumber emergencyType status verification visibility location locationLabel notes photos createdAt updatedAt"
    : "isSos referenceNumber emergencyType status verification visibility createdAt";

  const report = await EmergencyReportModel.findOne({ referenceNumber }).select(selectFields).lean();

  if (!report?.referenceNumber) return null;

  return {
    referenceNumber: report.referenceNumber,
    status: fromDbEmergencyStatus(report.status),
    type: fromDbEmergencyType(report.emergencyType),
    createdAt: report.createdAt ?? new Date(),
  };
}

export async function listMapEmergencyReports(limit = 300): Promise<MapEmergencyReport[]> {
  const docs = await EmergencyReportModel.find({
    status: { $nin: ["RESOLVED", "CANCELLED"] },
    "visibility.isVisibleOnMap": true,
    $or: [{ isSos: true }, { "verification.status": "approved" }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "isSos emergencyType status verification visibility referenceNumber location locationLabel notes createdAt"
    )
    .lean();

  return docs.map((report) => ({
    incidentId: report._id.toString(),
    referenceNumber: String(report.referenceNumber ?? ""),
    isSos: Boolean(report.isSos),
    type: String(report.emergencyType ?? "OTHER").toLowerCase(),
    status: fromDbEmergencyStatus(report.status),
    verificationStatus: report.verification?.status ?? (report.isSos ? "not_required" : "pending"),
    isVisibleOnMap: Boolean(report.visibility?.isVisibleOnMap),
    location: {
      coords: {
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
      },
      label: report.locationLabel,
    },
    description: report.notes,
    createdAt: report.createdAt ?? new Date(),
  }));
}

export async function listMyMapEmergencyReports(
  reporterUserId: string,
  limit = 300
): Promise<MapEmergencyReport[]> {
  if (!Types.ObjectId.isValid(reporterUserId)) return [];

  const docs = await EmergencyReportModel.find({
    reportedBy: new Types.ObjectId(reporterUserId),
    status: { $nin: ["RESOLVED", "CANCELLED"] },
    "visibility.isVisibleOnMap": true,
    $or: [{ isSos: true }, { "verification.status": "approved" }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "isSos emergencyType status verification visibility referenceNumber location locationLabel notes createdAt"
    )
    .lean();

  return docs.map((report) => ({
    incidentId: report._id.toString(),
    referenceNumber: String(report.referenceNumber ?? ""),
    isSos: Boolean(report.isSos),
    type: String(report.emergencyType ?? "OTHER").toLowerCase(),
    status: fromDbEmergencyStatus(report.status),
    verificationStatus: report.verification?.status ?? (report.isSos ? "not_required" : "pending"),
    isVisibleOnMap: Boolean(report.visibility?.isVisibleOnMap),
    location: {
      coords: {
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
      },
      label: report.locationLabel,
    },
    description: report.notes,
    createdAt: report.createdAt ?? new Date(),
  }));
}

export async function listPendingEmergencyApprovals(): Promise<PendingApprovalItem[]> {
  const docs = await EmergencyReportModel.find({
    isSos: false,
    "verification.status": "pending",
  })
    .sort({ createdAt: -1 })
    .select("referenceNumber emergencyType location locationLabel createdAt reportedBy reporterIsGuest")
    .populate("reportedBy", "firstName lastName role")
    .lean();

  const cache = new Map<string, string>();

  return Promise.all(
    docs.map(async (report: any) => {
      const lng = report.location?.coordinates?.[0];
      const lat = report.location?.coordinates?.[1];
      let barangay = "Unknown";

      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        const key = `${Number(lng).toFixed(5)},${Number(lat).toFixed(5)}`;
        const cached = cache.get(key);
        if (cached) {
          barangay = cached;
        } else {
          const found = await findBarangayByPoint(Number(lng), Number(lat), {
            city: "Dagupan City",
            province: "Pangasinan",
          });
          barangay = found?.name ?? "Unknown";
          cache.set(key, barangay);
        }
      }

      const firstName = String(report.reportedBy?.firstName ?? "").trim();
      const lastName = String(report.reportedBy?.lastName ?? "").trim();
      const reporterName = [firstName, lastName].filter(Boolean).join(" ") || "Guest Reporter";

      return {
        incidentId: report._id.toString(),
        referenceNumber: String(report.referenceNumber ?? ""),
        type: String(report.emergencyType ?? "OTHER").toLowerCase(),
        barangay,
        locationLabel: report.locationLabel,
        createdAt: report.createdAt ?? new Date(),
        reporter: {
          id: report.reportedBy?._id ? String(report.reportedBy._id) : undefined,
          name: reporterName,
          role: report.reportedBy?.role,
          isGuest: !report.reportedBy || Boolean(report.reporterIsGuest),
        },
      } as PendingApprovalItem;
    })
  );
}

export async function approveEmergencyReport(reportId: string, reviewerUserId: string) {
  if (!isValidObjectId(reportId)) return null;

  const updated = await EmergencyReportModel.findOneAndUpdate(
    {
      _id: reportId,
      isSos: false,
      "verification.status": "pending",
    },
    {
      $set: {
        "verification.status": "approved",
        "verification.reviewedBy": reviewerUserId,
        "verification.reviewedAt": new Date(),
        "verification.reason": undefined,
        "visibility.isVisibleOnMap": true,
      },
    },
    { new: true }
  )
    .select("_id referenceNumber verification visibility")
    .lean();

  if (!updated) return null;

  return {
    incidentId: updated._id.toString(),
    referenceNumber: String(updated.referenceNumber ?? ""),
    verificationStatus: updated.verification?.status ?? "approved",
    isVisibleOnMap: Boolean(updated.visibility?.isVisibleOnMap),
  };
}

export async function rejectEmergencyReport(reportId: string, reviewerUserId: string, reason: string) {
  if (!isValidObjectId(reportId)) return null;

  const updated = await EmergencyReportModel.findOneAndUpdate(
    {
      _id: reportId,
      isSos: false,
      "verification.status": "pending",
    },
    {
      $set: {
        "verification.status": "rejected",
        "verification.reviewedBy": reviewerUserId,
        "verification.reviewedAt": new Date(),
        "verification.reason": reason.trim(),
        "visibility.isVisibleOnMap": false,
      },
    },
    { new: true }
  )
    .select("_id referenceNumber verification visibility")
    .lean();

  if (!updated) return null;

  return {
    incidentId: updated._id.toString(),
    referenceNumber: String(updated.referenceNumber ?? ""),
    verificationStatus: updated.verification?.status ?? "rejected",
    isVisibleOnMap: Boolean(updated.visibility?.isVisibleOnMap),
  };
}

export async function getMyActiveEmergencyReport(reporterUserId: string): Promise<MyRequestSummary | null> {
  if (!Types.ObjectId.isValid(reporterUserId)) return null;

  const report = await EmergencyReportModel.findOne({
    reportedBy: new Types.ObjectId(reporterUserId),
    status: { $nin: ["RESOLVED", "CANCELLED"] },
  })
    .sort({ createdAt: -1 })
    .select("_id referenceNumber emergencyType status isSos verification createdAt updatedAt location locationLabel")
    .lean();

  if (!report) return null;

  const offers = await DispatchOffer.find({ emergencyId: report._id })
    .sort({ updatedAt: -1, _id: -1 })
    .select("status updatedAt lastKnownLocation lastKnownLocationAt")
    .lean();

  return buildMyRequestSummaryFromReport(report, offers, { includeEta: true });
}

function normalizeMyRequestListOptions(
  options?: { tab?: MyRequestStatusTab; scope?: LegacyScope } | LegacyScope
): { tab?: MyRequestStatusTab; scope?: LegacyScope } {
  if (!options) return {};
  if (typeof options === "string") {
    return { scope: options };
  }
  return options;
}

export async function listMyEmergencyReports(
  reporterUserId: string,
  options?: { tab?: MyRequestStatusTab; scope?: LegacyScope } | LegacyScope
): Promise<MyRequestSummary[]> {
  if (!Types.ObjectId.isValid(reporterUserId)) return [];
  const normalizedOptions = normalizeMyRequestListOptions(options);

  const reportQuery: Record<string, unknown> = {
    reportedBy: new Types.ObjectId(reporterUserId),
  };

  if (normalizedOptions.tab === "cancelled") {
    reportQuery.status = "CANCELLED";
  } else if (normalizedOptions.tab === "resolved" || normalizedOptions.tab === "review") {
    reportQuery.status = "RESOLVED";
  }

  const reports = await EmergencyReportModel.find(reportQuery)
    .sort({ createdAt: -1, _id: -1 })
    .select("_id referenceNumber emergencyType status isSos verification createdAt updatedAt location locationLabel")
    .lean();

  if (!reports.length) return [];

  const emergencyIds = reports.map((report) => report._id);
  const offers = await DispatchOffer.find({ emergencyId: { $in: emergencyIds } })
    .sort({ updatedAt: -1, _id: -1 })
    .select("emergencyId status updatedAt lastKnownLocation lastKnownLocationAt")
    .lean();

  const offersByEmergencyId = new Map<string, any[]>();
  for (const offer of offers) {
    const key = String(offer.emergencyId ?? "");
    if (!offersByEmergencyId.has(key)) {
      offersByEmergencyId.set(key, []);
    }
    offersByEmergencyId.get(key)!.push(offer);
  }

  const summaries = await Promise.all(
    reports.map(async (report) => {
      const reportOffers = offersByEmergencyId.get(String(report._id)) ?? [];
      const mappedTab = deriveMyRequestStatusTab(report, reportOffers);
      if (!matchesMyRequestFilter(mappedTab, normalizedOptions)) {
        return null;
      }

      return buildMyRequestSummaryFromReport(report, reportOffers, {
        includeEta: true,
        requestedTab: normalizedOptions.tab,
        mappedTab,
      });
    })
  );

  const filtered = summaries.filter((item): item is MyRequestSummary => item !== null);

  if (!normalizedOptions.tab || normalizedOptions.tab === "all") {
    return filtered.sort((a, b) => {
      const rankDiff = getRequestFlowRank(a.trackingLabel) - getRequestFlowRank(b.trackingLabel);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return filtered;
}

export async function getMyEmergencyReportCounts(
  reporterUserId: string
): Promise<MyRequestCountSummary> {
  const empty: MyRequestCountSummary = {
    assigned: 0,
    en_route: 0,
    arrived: 0,
    resolved: 0,
  };

  if (!Types.ObjectId.isValid(reporterUserId)) return empty;

  const reports = await EmergencyReportModel.find({
    reportedBy: new Types.ObjectId(reporterUserId),
  })
    .sort({ createdAt: -1, _id: -1 })
    .select("_id status isSos verification")
    .lean();

  if (!reports.length) return empty;

  const emergencyIds = reports.map((report) => report._id);
  const offers = await DispatchOffer.find({ emergencyId: { $in: emergencyIds } })
    .sort({ updatedAt: -1, _id: -1 })
    .select("emergencyId status")
    .lean();

  const offersByEmergencyId = new Map<string, any[]>();
  for (const offer of offers) {
    const key = String(offer.emergencyId ?? "");
    if (!offersByEmergencyId.has(key)) {
      offersByEmergencyId.set(key, []);
    }
    offersByEmergencyId.get(key)!.push(offer);
  }

  const counts: MyRequestCountSummary = { ...empty };
  for (const report of reports) {
    const mappedTab = deriveMyRequestStatusTab(
      report,
      offersByEmergencyId.get(String(report._id)) ?? []
    );

    if (mappedTab === "assigned") counts.assigned += 1;
    if (mappedTab === "en_route") counts.en_route += 1;
    if (mappedTab === "arrived") counts.arrived += 1;
    if (mappedTab === "resolved") counts.resolved += 1;
  }

  return counts;
}

export async function getMyEmergencyRequestTracking(
  reportId: string,
  reporterUserId: string
): Promise<MyRequestTrackingDTO | "FORBIDDEN" | null> {
  if (!Types.ObjectId.isValid(reportId) || !Types.ObjectId.isValid(reporterUserId)) return null;

  const report = await EmergencyReportModel.findById(reportId)
    .select("_id reportedBy referenceNumber emergencyType status createdAt updatedAt location notes")
    .lean();

  if (!report) return null;

  if (!report.reportedBy || String(report.reportedBy) !== String(reporterUserId)) {
    return "FORBIDDEN";
  }

  return buildEmergencyRequestTrackingDto(report);
}

export async function getEmergencyRequestTrackingSnapshot(
  reportId: string
): Promise<MyRequestTrackingDTO | null> {
  if (!Types.ObjectId.isValid(reportId)) return null;

  const report = await EmergencyReportModel.findById(reportId)
    .select("_id reportedBy referenceNumber emergencyType status createdAt updatedAt location notes")
    .lean();

  if (!report) return null;

  return buildEmergencyRequestTrackingDto(report);
}

async function buildEmergencyRequestTrackingDto(report: any): Promise<MyRequestTrackingDTO> {
  const reportId = String(report?._id ?? "").trim();
  if (!reportId) {
    throw new Error("Invalid report payload");
  }

  const offers = await DispatchOffer.find({ emergencyId: reportId })
    .sort({ updatedAt: -1, _id: -1 })
    .select("status updatedAt volunteerId lastKnownLocation lastKnownLocationAt")
    .populate({ path: "volunteerId", select: "firstName lastName contactNo" })
    .lean();

  const label = deriveTrackingLabel(report.status, offers);
  const activeStepIndex = toTimelineActiveStepIndex(label, report.status, offers);
  const requestLocation = toPointCoordinates(report.location?.coordinates) ?? { lng: 0, lat: 0 };
  const relevantOffer = pickRelevantOffer(offers);
  const responderOffer = pickResponderOffer(offers);
  const locationOffer = relevantOffer ?? responderOffer;
  const responderLocationPoint = toPointCoordinates(locationOffer?.lastKnownLocation?.coordinates);
  const etaPayload = responderLocationPoint
    ? await fetchResponderEtaAndRoute(responderLocationPoint, requestLocation)
    : { etaSeconds: null, routeGeometry: null };

  const responderStatus = String(responderOffer?.status ?? "").trim().toUpperCase();
  const hasResponder =
    Boolean(responderOffer) &&
    (responderStatus === "PENDING" ||
      responderStatus === "ACCEPTED" ||
      responderStatus === "DONE" ||
      responderStatus === "VERIFIED");

  const responderId = responderOffer?.volunteerId?._id
    ? String(responderOffer.volunteerId._id)
    : String(responderOffer?.volunteerId ?? "");
  const responderPhoneRaw = String(responderOffer?.volunteerId?.contactNo ?? "").trim();
  const responderPhone = responderPhoneRaw || undefined;

  const trackingUpdatedAt =
    locationOffer?.lastKnownLocationAt ??
    relevantOffer?.updatedAt ??
    report.updatedAt ??
    report.createdAt ??
    new Date();

  return {
    request: {
      id: reportId,
      referenceNumber: String(report.referenceNumber ?? ""),
      type: fromDbEmergencyType(report.emergencyType),
      createdAt: toIsoString(report.createdAt),
      status: String(report.status ?? "OPEN").toUpperCase() as IEmergencyReport["status"],
      location: requestLocation,
      ...(String(report.notes ?? "").trim() ? { notes: String(report.notes ?? "").trim() } : {}),
    },
    timeline: {
      steps: [...TRACKING_TIMELINE_STEPS],
      activeStepIndex,
    },
    tracking: {
      label,
      etaSeconds: etaPayload.etaSeconds,
      lastUpdatedAt: toIsoString(trackingUpdatedAt),
      ...(hasResponder && responderId
        ? {
            responder: {
              id: responderId,
              name: toResponderName(responderOffer),
              ...(responderPhone ? { phone: responderPhone } : {}),
            },
          }
        : {}),
      ...(responderLocationPoint
        ? {
            responderLocation: {
              ...responderLocationPoint,
              at: toIsoString(locationOffer?.lastKnownLocationAt ?? trackingUpdatedAt),
            },
          }
        : {}),
      routeGeometry: etaPayload.routeGeometry,
    },
  };
}
