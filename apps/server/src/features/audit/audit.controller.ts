import type { Request, Response } from "express";
import { getAuditByEventId, queryAuditLogs } from "./audit.service";
import { User } from "../users/user.model";

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
  let scopeBarangay: string | undefined;

  if (req.role === "LGU") {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const actor = await User.findById(req.userId).select("barangay").lean();
    scopeBarangay = actor?.barangay ? String(actor.barangay) : "__none__";
  } else if (typeof req.query.scopeBarangay === "string") {
    scopeBarangay = req.query.scopeBarangay;
  }

  const result = await queryAuditLogs({
    from: parseDate(req.query.from),
    to: parseDate(req.query.to),
    eventType: typeof req.query.eventType === "string" ? req.query.eventType : undefined,
    severity: typeof req.query.severity === "string" ? req.query.severity : undefined,
    outcome: typeof req.query.outcome === "string" ? req.query.outcome : undefined,
    actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
    targetType: typeof req.query.targetType === "string" ? req.query.targetType : undefined,
    targetId: typeof req.query.targetId === "string" ? req.query.targetId : undefined,
    scopeBarangay,
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

  if (req.role === "LGU") {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const actor = await User.findById(req.userId).select("barangay").lean();
    const barangay = actor?.barangay ? String(actor.barangay) : "";
    if (!barangay || String((item as any).scopeBarangay ?? "") !== barangay) {
      return res.status(404).json({ message: "Audit event not found" });
    }
  }

  return res.json({ item });
}

function csvEscape(value: unknown) {
  const raw = String(value ?? "");
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export async function exportAuditLogsCsv(req: Request, res: Response) {
  const maxRows = 5_000;
  const rows: Record<string, unknown>[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && rows.length < maxRows) {
    const result = await queryAuditLogs({
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      eventType: typeof req.query.eventType === "string" ? req.query.eventType : undefined,
      severity: typeof req.query.severity === "string" ? req.query.severity : undefined,
      outcome: typeof req.query.outcome === "string" ? req.query.outcome : undefined,
      actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
      targetType: typeof req.query.targetType === "string" ? req.query.targetType : undefined,
      targetId: typeof req.query.targetId === "string" ? req.query.targetId : undefined,
      scopeBarangay: typeof req.query.scopeBarangay === "string" ? req.query.scopeBarangay : undefined,
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      page,
      limit: 100,
    });

    rows.push(...(result.items as unknown as Record<string, unknown>[]));
    hasNext = page < result.pagination.totalPages;
    page += 1;
  }

  const headers = [
    "timestamp",
    "eventId",
    "eventType",
    "severity",
    "outcome",
    "actorId",
    "actorRole",
    "targetType",
    "targetId",
    "scopeBarangay",
    "requestPath",
    "requestMethod",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row: any) =>
      [
        row.timestamp,
        row.eventId,
        row.eventType,
        row.severity,
        row.outcome,
        row.actor?.id,
        row.actor?.role,
        row.target?.type,
        row.target?.id,
        row.scopeBarangay,
        row.request?.path,
        row.request?.method,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=\"audit-logs-${new Date().toISOString().slice(0, 10)}.csv\"`);
  return res.status(200).send(lines.join("\n"));
}
