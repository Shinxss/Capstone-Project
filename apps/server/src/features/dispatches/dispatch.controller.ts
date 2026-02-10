import type { Request, Response } from "express";
import {
  createDispatchOffers,
  getLatestPendingOfferForVolunteer,
  respondToOffer,
} from "./dispatch.service";

function getUser(req: Request): { id: string; role: string } | null {
  return (req as any).user ?? null;
}

export async function dispatchToVolunteers(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!['LGU','ADMIN'].includes(user.role)) return res.status(403).json({ message: "Forbidden" });

    const { emergencyId, volunteerIds } = (req.body ?? {}) as any;
    if (!emergencyId || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).json({ message: "emergencyId and volunteerIds[] are required" });
    }

    const data = await createDispatchOffers({
      emergencyId: String(emergencyId),
      volunteerIds: volunteerIds.map(String),
      dispatchedById: user.id,
    });

    return res.json({ data });
  } catch (e: any) {
    const status = e?.statusCode ?? 500;
    return res.status(status).json({ message: e?.message ?? "Failed to dispatch" });
  }
}

export async function getMyPendingDispatch(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== 'VOLUNTEER') return res.status(403).json({ message: "Forbidden" });

    const data = await getLatestPendingOfferForVolunteer(user.id);
    return res.json({ data });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message ?? "Failed to fetch pending dispatch" });
  }
}

export async function respondToMyDispatch(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== 'VOLUNTEER') return res.status(403).json({ message: "Forbidden" });

    const offerId = String((req.params as any).id ?? "");
    const decisionRaw = String((req.body as any)?.decision ?? "").toUpperCase();
    if (!offerId) return res.status(400).json({ message: "offer id is required" });
    if (!['ACCEPT','DECLINE'].includes(decisionRaw)) {
      return res.status(400).json({ message: "decision must be ACCEPT or DECLINE" });
    }

    const data = await respondToOffer({
      offerId,
      volunteerId: user.id,
      decision: decisionRaw as any,
    });

    return res.json({ data });
  } catch (e: any) {
    const status = e?.statusCode ?? 500;
    return res.status(status).json({ message: e?.message ?? "Failed to respond" });
  }
}
