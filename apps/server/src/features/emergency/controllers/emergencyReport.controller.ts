import type { Request, Response } from "express";
import {
  approveEmergencyReport,
  createEmergencyReport,
  getEmergencyReportById,
  getEmergencyReportByReference,
  listMapEmergencyReports,
  listPendingEmergencyApprovals,
  rejectEmergencyReport,
} from "../services/emergencyReport.service";
import type {
  CreateEmergencyReportInput,
  RejectEmergencyReportInput,
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
    return res.status(500).json({ message: error?.message ?? "Failed to create emergency report" });
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
