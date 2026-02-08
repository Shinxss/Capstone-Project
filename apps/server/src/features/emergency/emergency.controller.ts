import type { Request, Response } from "express";
import { Types } from "mongoose";
import * as emergencyService from "./emergency.service";

type AuthedRequest = Request & { user?: { id: string; role?: string } };

export async function postSos(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const { lat, lng, accuracy, notes } = req.body ?? {};

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "lat and lng are required numbers" });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid lat/lng range" });
    }

    const report = await emergencyService.createSosReport({
      reportedBy: new Types.ObjectId(req.user.id),
      lat,
      lng,
      accuracy: typeof accuracy === "number" ? accuracy : undefined,
      notes: typeof notes === "string" ? notes : undefined,
    });

    return res.status(201).json({ data: report });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}

// ✅ LIST REPORTS
export async function listReports(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 200;

    const items = await emergencyService.listReports({ limit });
    return res.json({ data: items });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}
