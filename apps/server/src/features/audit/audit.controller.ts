import type { Request, Response } from "express";
import { getAuditByEventId, queryAuditLogs } from "./audit.service";

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function parseNumber(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

export async function listAuditLogs(req: Request, res: Response) {
  const result = await queryAuditLogs({
    from: parseDate(req.query.from),
    to: parseDate(req.query.to),
    eventType: typeof req.query.eventType === "string" ? req.query.eventType : undefined,
    severity: typeof req.query.severity === "string" ? req.query.severity : undefined,
    outcome: typeof req.query.outcome === "string" ? req.query.outcome : undefined,
    actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
    targetType: typeof req.query.targetType === "string" ? req.query.targetType : undefined,
    targetId: typeof req.query.targetId === "string" ? req.query.targetId : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    page: parseNumber(req.query.page, 1),
    limit: parseNumber(req.query.limit, 20),
  });

  return res.json(result);
}

export async function getAuditLogByEventId(req: Request, res: Response) {
  const eventId = String(req.params.eventId || "").trim();
  if (!eventId) {
    return res.status(400).json({ message: "eventId is required" });
  }

  const item = await getAuditByEventId(eventId);
  if (!item) {
    return res.status(404).json({ message: "Audit event not found" });
  }

  return res.json({ item });
}
