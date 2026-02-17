import type { Request, Response } from "express";
import { Types } from "mongoose";
import { getAuditActor, getAuditRequestContext, logAuditEvent } from "../audit/audit.service";
import type { HazardType } from "./hazardZone.model";
import * as hazardZoneService from "./hazardZone.service";

type AuthedRequest = Request & { user?: { id: string; role?: string } };

const ALLOWED: HazardType[] = ["FLOODED", "ROAD_CLOSED", "FIRE_RISK", "LANDSLIDE", "UNSAFE"];
const ALLOWED_SET = new Set<HazardType>(ALLOWED);

export async function listHazardZones(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 500;
    const items = await hazardZoneService.listHazardZones({
      limit: Number.isFinite(limit) ? limit : 500,
    });

    return res.json({ data: items });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}

export async function createHazardZone(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const { name, hazardType, geometry } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (typeof hazardType !== "string" || !ALLOWED_SET.has(hazardType as HazardType)) {
      return res.status(400).json({ message: "hazardType is invalid" });
    }
    const typedHazardType = hazardType as HazardType;

    if (!geometry || typeof geometry !== "object") {
      return res.status(400).json({ message: "geometry is required" });
    }
    if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
      return res.status(400).json({ message: "geometry.type must be Polygon or MultiPolygon" });
    }
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      return res.status(400).json({ message: "geometry.coordinates must be an array" });
    }

    const created = await hazardZoneService.createHazardZone({
      name: name.trim(),
      hazardType: typedHazardType,
      geometry: { type: geometry.type, coordinates: geometry.coordinates },
      createdBy: new Types.ObjectId(req.user.id),
    });

    const actor = getAuditActor(req);
    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "HAZARD_CREATE",
      targetType: "HazardZone",
      targetId: String((created as any)?._id ?? ""),
      metadata: { hazardType: typedHazardType },
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return res.status(201).json({ data: created });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}

export async function deleteHazardZone(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleted = await hazardZoneService.softDeleteHazardZone(id);
    if (!deleted) return res.status(404).json({ message: "Hazard zone not found" });

    const actor = getAuditActor(req);
    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "HAZARD_DELETE",
      targetType: "HazardZone",
      targetId: id,
      metadata: {},
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return res.json({ data: { ok: true } });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}

export async function updateHazardZoneStatus(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const { isActive } = req.body ?? {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const updated = await hazardZoneService.updateHazardZoneStatus(id, isActive);
    if (!updated) return res.status(404).json({ message: "Hazard zone not found" });

    const actor = getAuditActor(req);
    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: "HAZARD_STATUS",
      targetType: "HazardZone",
      targetId: id,
      metadata: { isActive },
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}
