import type { Request, Response } from "express";
import {
  approveEmergencyReport,
  createEmergencyReport,
  getEmergencyReportById,
  getEmergencyReportByReference,
  getMyActiveEmergencyReport,
  getMyEmergencyReportCounts,
  getMyEmergencyRequestTracking,
  listMapEmergencyReports,
  listMyEmergencyReports,
  listPendingEmergencyApprovals,
  rejectEmergencyReport,
} from "../services/emergencyReport.service";
import { notifyRequestTrackingUpdated } from "../services/requestRealtime.service";
import { uploadEmergencyReportPhoto } from "../services/emergencyReportUpload.service";
import { AUDIT_EVENT } from "../../audit/audit.constants";
import { logAudit } from "../../audit/audit.service";
import { emitNotificationsRefresh } from "../../../realtime/notificationsSocket";
import type {
  CreateEmergencyReportInput,
  MyEmergencyReportsQuery,
  RejectEmergencyReportInput,
  UploadEmergencyReportPhotoInput,
} from "../schemas/emergencyReport.schema";

type MaybeAuthedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

export async function postEmergencyReport(req: MaybeAuthedRequest, res: Response) {
  try {
    const input = req.body as CreateEmergencyReportInput;
    const reporterUserId = req.user?.id;

    const report = await createEmergencyReport(input, reporterUserId);
    await notifyRequestTrackingUpdated(
      report.incidentId,
      report.isSos ? "request_submitted" : "verification_started",
      {
        stepOverride: report.isSos ? "Submitted" : "Verification",
      }
    ).catch(() => undefined);

    if (report.isVisibleOnMap) {
      emitNotificationsRefresh("emergency_reported", ["LGU", "ADMIN"]);
    }

    return res.status(201).json({
      incidentId: report.incidentId,
      referenceNumber: report.referenceNumber,
      isSos: report.isSos,
      verificationStatus: report.verificationStatus,
      isVisibleOnMap: report.isVisibleOnMap,
      createdAt: report.createdAt,
      location: {
        coords: report.location.coords,
        ...(report.location.label ? { label: report.location.label } : {}),
      },
    });
  } catch (error: any) {
    const message = String(error?.message ?? "Failed to create emergency report");
    if (message === "Invalid photo URL" || message === "At least 3 proof images are required.") {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message });
  }
}

export async function postEmergencyReportPhoto(req: MaybeAuthedRequest, res: Response) {
  try {
    const input = req.body as UploadEmergencyReportPhotoInput;
    const reporterUserId = req.user?.id;

    const uploaded = await uploadEmergencyReportPhoto({
      base64: input.base64,
      mimeType: input.mimeType,
      fileName: input.fileName,
      reporterUserId,
    });

    return res.status(201).json({ url: uploaded.url });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to upload emergency photo" });
  }
}

export async function getEmergencyReportDetail(req: MaybeAuthedRequest, res: Response) {
  try {
    const reportId = String(req.params.id || "").trim();
    const report = await getEmergencyReportById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Emergency report not found" });
    }

    if (!req.user?.id) {
      return res.status(200).json({
        incidentId: report.incidentId,
        referenceNumber: report.referenceNumber,
        isSos: report.isSos,
        verificationStatus: report.verificationStatus,
        isVisibleOnMap: report.isVisibleOnMap,
        status: report.status,
        type: report.type,
        createdAt: report.createdAt,
      });
    }

    return res.status(200).json(report);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch emergency report" });
  }
}

export async function getEmergencyReportsMapFeed(_req: Request, res: Response) {
  try {
    const items = await listMapEmergencyReports();
    return res.status(200).json({ data: items });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch map feed" });
  }
}

export async function getMyActiveEmergencyReportController(req: MaybeAuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const report = await getMyActiveEmergencyReport(String(req.user.id));
    if (!report) {
      return res.status(404).json({ message: "No active emergency request found" });
    }

    return res.status(200).json(report);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch active emergency request" });
  }
}

export async function listMyEmergencyReportsController(req: MaybeAuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const query = req.query as unknown as MyEmergencyReportsQuery;
    const items = await listMyEmergencyReports(String(req.user.id), {
      tab: query.tab,
      scope: query.scope,
    });
    return res.status(200).json(items);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch emergency requests" });
  }
}

export async function getMyEmergencyReportCountsController(req: MaybeAuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const counts = await getMyEmergencyReportCounts(String(req.user.id));
    return res.status(200).json(counts);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch emergency request counts" });
  }
}

export async function getMyEmergencyTrackingController(req: MaybeAuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const reportId = String(req.params.id ?? "").trim();
    const tracking = await getMyEmergencyRequestTracking(reportId, String(req.user.id));

    if (!tracking) {
      return res.status(404).json({ message: "Emergency request not found" });
    }

    if (tracking === "FORBIDDEN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(tracking);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch emergency tracking details" });
  }
}

export async function listPendingEmergencyApprovalsController(_req: Request, res: Response) {
  try {
    const status = String(_req.query.status ?? "pending");
    if (status !== "pending") {
      return res.status(200).json({ data: [] });
    }

    const data = await listPendingEmergencyApprovals();
    return res.status(200).json({ data });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch approvals queue" });
  }
}

export async function approveEmergencyReportController(req: MaybeAuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const updated = await approveEmergencyReport(String(req.params.id || "").trim(), req.user.id);
    if (!updated) return res.status(404).json({ message: "Emergency report not found" });

    await logAudit(req, {
      eventType: AUDIT_EVENT.EMERGENCY_REPORT_APPROVAL,
      outcome: "SUCCESS",
      actor: {
        id: req.user.id,
        role: String(req.user.role ?? ""),
      },
      target: {
        type: "EMERGENCY_REPORT",
        id: updated.incidentId,
      },
      metadata: {
        decision: "APPROVED",
        referenceNumber: updated.referenceNumber,
        verificationStatus: updated.verificationStatus,
        isVisibleOnMap: updated.isVisibleOnMap,
      },
    });

    emitNotificationsRefresh("emergency_reported", ["LGU", "ADMIN"]);

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to approve emergency report" });
  }
}

export async function rejectEmergencyReportController(req: MaybeAuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const body = req.body as RejectEmergencyReportInput;
    const updated = await rejectEmergencyReport(String(req.params.id || "").trim(), req.user.id, body.reason);

    if (!updated) return res.status(404).json({ message: "Emergency report not found" });

    await logAudit(req, {
      eventType: AUDIT_EVENT.EMERGENCY_REPORT_APPROVAL,
      outcome: "SUCCESS",
      actor: {
        id: req.user.id,
        role: String(req.user.role ?? ""),
      },
      target: {
        type: "EMERGENCY_REPORT",
        id: updated.incidentId,
      },
      metadata: {
        decision: "REJECTED",
        reason: String(body.reason ?? "").trim(),
        referenceNumber: updated.referenceNumber,
        verificationStatus: updated.verificationStatus,
        isVisibleOnMap: updated.isVisibleOnMap,
      },
    });

    emitNotificationsRefresh("emergency_status_updated", ["LGU", "ADMIN"]);

    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to reject emergency report" });
  }
}

export async function getEmergencyReportByReferenceNumber(req: Request, res: Response) {
  try {
    const referenceNumber = String(req.params.referenceNumber || "").trim().toUpperCase();
    const report = await getEmergencyReportByReference(referenceNumber, false);

    if (!report) {
      return res.status(404).json({ message: "Emergency report not found" });
    }

    return res.status(200).json({
      referenceNumber: report.referenceNumber,
      status: report.status,
      type: report.type,
      createdAt: report.createdAt,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message ?? "Failed to fetch emergency report" });
  }
}
