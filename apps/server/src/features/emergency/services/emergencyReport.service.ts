import { isValidObjectId } from "mongoose";
import {
  EmergencyReportModel,
  type EmergencyReportDocument,
  type IEmergencyReport,
} from "../models/EmergencyReport.model";
import type { CreateEmergencyReportInput } from "../schemas/emergencyReport.schema";
import {
  MAX_REFERENCE_ATTEMPTS,
  generateReferenceNumberCandidate,
} from "../utils/referenceNumber";
import type { VerificationStatus } from "../emergency.model";
import { findBarangayByPoint } from "../../barangays/barangay.service";

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

export async function createEmergencyReport(
  input: CreateEmergencyReportInput,
  reporterUserId?: string
): Promise<CreateEmergencyReportResult> {
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
        locationLabel: input.location.label,
        notes: input.description,
        photos: input.photos ?? [],
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
      "isSos referenceNumber emergencyType status verification visibility location locationLabel notes photos createdAt updatedAt"
    )
    .lean();

  if (!report) return null;

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
    $or: [{ isSos: true }, { "verification.status": "approved" }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "isSos emergencyType verification visibility referenceNumber location locationLabel notes createdAt"
    )
    .lean();

  return docs.map((report) => ({
    incidentId: report._id.toString(),
    referenceNumber: String(report.referenceNumber ?? ""),
    isSos: Boolean(report.isSos),
    type: String(report.emergencyType ?? "OTHER").toLowerCase(),
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
