import {
  emergencyTitleForType,
  normalizeEmergencyType,
} from "../../emergency/constants/emergency.constants";
import type { EmergencyReport, Reporter } from "../../emergency/models/emergency.types";
import type {
  EmergencyApprovalDetailResponse,
  EmergencyApprovalItem,
  EmergencyApprovalSeverity,
  EmergencyApprovalStatus,
  PendingEmergencyApproval,
} from "../models/approvals.types";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeVerificationStatus(value: unknown): EmergencyApprovalStatus {
  const status = clean(value).toLowerCase();
  if (status === "approved" || status === "rejected" || status === "not_required") return status;
  return "pending";
}

export function deriveApprovalSeverity(type: string): EmergencyApprovalSeverity {
  const normalized = normalizeEmergencyType(type);
  if (["FIRE", "EARTHQUAKE", "COLLAPSE", "MEDICAL"].includes(normalized)) return "high";
  if (["FLOOD", "TYPHOON"].includes(normalized)) return "medium";
  return "low";
}

function reporterName(reporter: Reporter | string | undefined, fallback?: PendingEmergencyApproval) {
  if (reporter && typeof reporter === "object") {
    const name = [reporter.firstName, reporter.lastName].map(clean).filter(Boolean).join(" ");
    return name || clean(reporter.username) || clean(reporter.email) || fallback?.reporter.name || "Guest Reporter";
  }
  return fallback?.reporter.name || "Guest Reporter";
}

export function toApprovalItem(
  report: EmergencyReport,
  pending?: PendingEmergencyApproval
): EmergencyApprovalItem | null {
  const type = normalizeEmergencyType(report.emergencyType);
  const isSos = report.isSos === true || type === "SOS";
  if (isSos) return null;

  const reporter = report.reportedBy && typeof report.reportedBy === "object"
    ? report.reportedBy
    : undefined;
  const longitude = Number(report.location?.coordinates?.[0]);
  const latitude = Number(report.location?.coordinates?.[1]);
  const coordinates: [number, number] | undefined =
    Number.isFinite(longitude) && Number.isFinite(latitude)
      ? [longitude, latitude]
      : undefined;

  return {
    incidentId: clean(report._id),
    referenceNumber: clean(report.referenceNumber) || clean(report._id),
    type,
    title: emergencyTitleForType(type),
    barangay: pending?.barangay || clean(report.barangayName) || "Unknown",
    locationLabel:
      clean(report.locationLabel) ||
      [report.barangayName, report.barangayCity, report.barangayProvince]
        .map(clean)
        .filter(Boolean)
        .join(", ") ||
      undefined,
    description: clean(report.notes) || `Reported ${emergencyTitleForType(type).toLowerCase()}.`,
    createdAt: clean(report.createdAt) || clean(report.reportedAt) || new Date(0).toISOString(),
    reportedAt: clean(report.reportedAt) || clean(report.createdAt) || undefined,
    updatedAt: clean(report.updatedAt) || undefined,
    reviewedAt: clean(report.verification?.reviewedAt) || undefined,
    rejectionReason: clean(report.verification?.reason) || undefined,
    status: normalizeVerificationStatus(report.verification?.status),
    severity: deriveApprovalSeverity(type),
    photos: Array.isArray(report.photos) ? report.photos.map(clean).filter(Boolean) : [],
    coordinates,
    reporter: {
      id: reporter?._id || pending?.reporter.id,
      name: reporterName(report.reportedBy, pending),
      role: clean(reporter?.role) || pending?.reporter.role,
      isGuest: Boolean(report.reporterIsGuest) || pending?.reporter.isGuest === true,
      email: clean(reporter?.email) || undefined,
      phone: clean(reporter?.contactNo) || clean(report.guestReporter?.phoneNumber) || undefined,
      avatarUrl: clean(reporter?.avatarUrl) || undefined,
    },
  };
}

export function mergeApprovalDetail(
  detail: EmergencyApprovalDetailResponse,
  feedItem?: EmergencyApprovalItem
): EmergencyApprovalItem {
  const type = normalizeEmergencyType(detail.type || feedItem?.type || "OTHER");
  const longitude = Number(detail.location?.coords?.longitude);
  const latitude = Number(detail.location?.coords?.latitude);
  const coordinates: [number, number] | undefined =
    Number.isFinite(longitude) && Number.isFinite(latitude)
      ? [longitude, latitude]
      : feedItem?.coordinates;
  const reporterNameFromDetail = [detail.reporter?.firstName, detail.reporter?.lastName]
    .map(clean)
    .filter(Boolean)
    .join(" ");

  return {
    incidentId: detail.incidentId,
    referenceNumber: clean(detail.referenceNumber) || feedItem?.referenceNumber || detail.incidentId,
    type,
    title: feedItem?.title || emergencyTitleForType(type),
    barangay: feedItem?.barangay || "Unknown",
    locationLabel: clean(detail.location?.label) || feedItem?.locationLabel,
    description: clean(detail.description) || feedItem?.description || `Reported ${emergencyTitleForType(type).toLowerCase()}.`,
    createdAt: clean(detail.createdAt) || feedItem?.createdAt || new Date(0).toISOString(),
    reportedAt: clean(detail.reportedAt) || feedItem?.reportedAt,
    updatedAt: clean(detail.updatedAt) || feedItem?.updatedAt,
    reviewedAt: feedItem?.reviewedAt,
    rejectionReason: feedItem?.rejectionReason,
    status: normalizeVerificationStatus(detail.verificationStatus || feedItem?.status),
    severity: feedItem?.severity || deriveApprovalSeverity(type),
    photos: Array.isArray(detail.photos)
      ? detail.photos.map(clean).filter(Boolean)
      : feedItem?.photos || [],
    coordinates,
    reporter: {
      id: detail.reporter?.id || feedItem?.reporter.id,
      name:
        reporterNameFromDetail ||
        clean(detail.reporter?.username) ||
        clean(detail.reporter?.email) ||
        feedItem?.reporter.name ||
        "Guest Reporter",
      role: clean(detail.reporter?.role) || feedItem?.reporter.role,
      isGuest: detail.reporter?.isGuest ?? feedItem?.reporter.isGuest ?? true,
      email: clean(detail.reporter?.email) || feedItem?.reporter.email,
      phone: clean(detail.reporter?.contactNo) || feedItem?.reporter.phone,
      avatarUrl: clean(detail.reporter?.avatarUrl) || feedItem?.reporter.avatarUrl,
    },
  };
}

export function formatApprovalRole(value?: string, isGuest?: boolean) {
  if (isGuest) return "Guest Reporter";
  const role = clean(value);
  if (!role) return "Community Member";
  return role
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function approvalLocation(item: EmergencyApprovalItem) {
  return clean(item.locationLabel) || (item.barangay !== "Unknown" ? `Barangay ${item.barangay}` : "Unknown location");
}

export function formatApprovalDate(value?: string) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatApprovalCoordinates(coordinates?: [number, number]) {
  if (!coordinates) return "Coordinates unavailable";
  const [longitude, latitude] = coordinates;
  return `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? "N" : "S"}, ${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? "E" : "W"}`;
}
