import { randomUUID } from "crypto";
import type { ProjectionType } from "mongoose";
import type { Request } from "express";
import { AUDIT_EVENT, AUDIT_EVENT_SEVERITY, AUDIT_OUTCOME, AUDIT_SEVERITY, type AuditEventType, type AuditOutcome, type AuditSeverity } from "./audit.constants";
import { AuditLog, type AuditLogDoc } from "./audit.model";

type FilterQuery<T> = Partial<Record<keyof T, unknown>> & Record<string, unknown>;

const SENSITIVE_KEY = /password|otp|token|jwt|authorization|cookie|set-cookie|secret|privatekey|refresh/i;
const EMAIL_KEY = /email/i;
const PHONE_KEY = /phone|mobile|contact/i;
const CONTROL_CHARS = /[\r\n\t\x00-\x1F\x7F]/g;
const MAX_STRING_LENGTH = 500;
const VALID_EVENT_TYPES = new Set<string>(Object.values(AUDIT_EVENT));
const VALID_SEVERITIES = new Set<string>(Object.values(AUDIT_SEVERITY));
const VALID_OUTCOMES = new Set<string>(Object.values(AUDIT_OUTCOME));

type AuditPayload = {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  action?: string;
  outcome: AuditOutcome;
  timestamp?: Date;
  actor?: {
    id?: string;
    role?: string;
    email?: string;
  };
  target?: {
    type?: string;
    id?: string;
  };
  source?: {
    ip?: string;
    userAgent?: string;
    origin?: string;
  };
  request?: {
    method?: string;
    path?: string;
    requestId?: string;
    correlationId?: string;
  };
  metadata?: Record<string, unknown>;
};

type QueryAuditInput = {
  from?: Date;
  to?: Date;
  eventType?: string;
  severity?: string;
  outcome?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  q?: string;
  page?: number;
  limit?: number;
};

function sanitizeString(value: unknown, maxLen = MAX_STRING_LENGTH) {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, " ").trim().slice(0, maxLen);
}

function maskEmail(value: string) {
  const clean = sanitizeString(value);
  const [local = "", domain = ""] = clean.split("@");
  if (!local || !domain) return clean;
  const lead = local[0] ?? "*";
  return `${lead}***@${domain}`;
}

function maskPhone(value: string) {
  const digits = sanitizeString(value).replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function normalizeError(error: Error) {
  const stack = process.env.NODE_ENV === "production" ? undefined : sanitizeString(error.stack, 2000);
  return {
    name: sanitizeString(error.name, 120),
    message: sanitizeString(error.message, 1000),
    ...(stack ? { stack } : {}),
  };
}

function sanitizeMetadataValue(key: string, value: unknown, depth = 0): unknown {
  if (depth > 8) return "[TRUNCATED_DEPTH]";

  if (value instanceof Error) {
    return normalizeError(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((entry) => sanitizeMetadataValue(key, entry, depth + 1));
  }

  if (typeof value === "string") {
    const clean = sanitizeString(value);
    if (EMAIL_KEY.test(key)) return maskEmail(clean);
    if (PHONE_KEY.test(key)) return maskPhone(clean);
    return clean;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(k)) {
      continue;
    }
    output[sanitizeString(k, 120)] = sanitizeMetadataValue(k, v, depth + 1);
  }

  return output;
}

export function sanitizeAuditMetadata(metadata?: Record<string, unknown>) {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  return sanitizeMetadataValue("metadata", metadata) as Record<string, unknown>;
}

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return sanitizeString(String(forwarded[0]).split(",")[0], 100);
  }

  if (typeof forwarded === "string" && forwarded.trim()) {
    return sanitizeString(forwarded.split(",")[0], 100);
  }

  return sanitizeString(req.ip ?? "", 100);
}

function resolveActor(req?: Request) {
  if (!req) return {};

  const actorId = sanitizeString((req as any).user?.id ?? req.userId ?? "", 120);
  const actorRole = sanitizeString((req as any).user?.role ?? req.role ?? "", 50);

  return {
    id: actorId || undefined,
    role: actorRole || undefined,
  };
}

function resolveSource(req?: Request) {
  if (!req) return {};

  const fromContext = req.clientContext;
  const ip = sanitizeString(fromContext?.ip ?? getClientIp(req), 100);
  const userAgent = sanitizeString(fromContext?.userAgent ?? req.headers["user-agent"], 500);
  const origin = sanitizeString(fromContext?.origin ?? req.headers.origin, 500);

  return {
    ip: ip || undefined,
    userAgent: userAgent || undefined,
    origin: origin || undefined,
  };
}

function resolveRequest(req?: Request) {
  if (!req) return {};

  return {
    method: sanitizeString(req.method, 20) || undefined,
    path: sanitizeString(req.originalUrl || req.path, 500) || undefined,
    requestId: sanitizeString(req.requestId, 100) || randomUUID(),
    correlationId: sanitizeString(req.correlationId, 100) || randomUUID(),
  };
}

export async function logAudit(req: Request | undefined, payload: AuditPayload) {
  try {
    const actorFromReq = resolveActor(req);
    const sourceFromReq = resolveSource(req);
    const requestFromReq = resolveRequest(req);

    const actorEmail = payload.actor?.email ? maskEmail(payload.actor.email) : undefined;
    const action = sanitizeString(payload.action ?? payload.eventType, 120);

    await AuditLog.create({
      eventId: randomUUID(),
      timestamp: payload.timestamp ?? new Date(),
      eventType: payload.eventType,
      severity: payload.severity ?? AUDIT_EVENT_SEVERITY[payload.eventType],
      action: action || payload.eventType,
      outcome: payload.outcome,
      actor: {
        id: sanitizeString(payload.actor?.id ?? actorFromReq.id, 120) || undefined,
        role: sanitizeString(payload.actor?.role ?? actorFromReq.role, 50) || undefined,
        email: actorEmail,
      },
      target: {
        type: sanitizeString(payload.target?.type, 120) || undefined,
        id: sanitizeString(payload.target?.id, 120) || undefined,
      },
      source: {
        ip: sanitizeString(payload.source?.ip ?? sourceFromReq.ip, 100) || undefined,
        userAgent: sanitizeString(payload.source?.userAgent ?? sourceFromReq.userAgent, 500) || undefined,
        origin: sanitizeString(payload.source?.origin ?? sourceFromReq.origin, 500) || undefined,
      },
      request: {
        method: sanitizeString(payload.request?.method ?? requestFromReq.method, 20) || undefined,
        path: sanitizeString(payload.request?.path ?? requestFromReq.path, 500) || undefined,
        requestId: sanitizeString(payload.request?.requestId ?? requestFromReq.requestId, 100) || randomUUID(),
        correlationId: sanitizeString(payload.request?.correlationId ?? requestFromReq.correlationId, 100) || randomUUID(),
      },
      metadata: sanitizeAuditMetadata(payload.metadata),
    });
  } catch {
    // Prevent audit failures from breaking primary request flow.
  }
}

export async function logSecurityEvent(
  req: Request | undefined,
  eventType: AuditEventType,
  outcome: AuditOutcome,
  metadata?: Record<string, unknown>
) {
  return logAudit(req, {
    eventType,
    outcome,
    metadata,
    action: eventType,
  });
}

export function getAuditActor(req: Request) {
  const actor = resolveActor(req);
  return {
    actorId: actor.id ?? "",
    actorRole: actor.role ?? "",
  };
}

export function getAuditRequestContext(req: Request) {
  const source = resolveSource(req);
  return {
    ip: source.ip ?? "",
    userAgent: source.userAgent ?? "",
    origin: source.origin ?? "",
  };
}

type AuditListItem = Omit<AuditLogDoc, never>;

export async function queryAuditLogs(input: QueryAuditInput): Promise<{
  items: AuditListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const page = Math.max(1, Number.isFinite(input.page) ? Number(input.page) : 1);
  const limit = Math.min(100, Math.max(1, Number.isFinite(input.limit) ? Number(input.limit) : 20));

  const filter: FilterQuery<AuditLogDoc> = {};

  if (input.from || input.to) {
    const timestampRange: { $gte?: Date; $lte?: Date } = {};
    if (input.from) timestampRange.$gte = input.from;
    if (input.to) timestampRange.$lte = input.to;
    filter.timestamp = timestampRange;
  }

  if (input.eventType) {
    const eventType = sanitizeString(input.eventType, 120);
    if (VALID_EVENT_TYPES.has(eventType)) {
      filter.eventType = eventType;
    }
  }

  if (input.severity) {
    const severity = sanitizeString(input.severity, 20).toUpperCase();
    if (VALID_SEVERITIES.has(severity)) {
      filter.severity = severity;
    }
  }

  if (input.outcome) {
    const outcome = sanitizeString(input.outcome, 20).toUpperCase();
    if (VALID_OUTCOMES.has(outcome)) {
      filter.outcome = outcome;
    }
  }
  if (input.actorId) filter["actor.id"] = sanitizeString(input.actorId, 120);
  if (input.targetType) filter["target.type"] = sanitizeString(input.targetType, 120);
  if (input.targetId) filter["target.id"] = sanitizeString(input.targetId, 120);

  const q = sanitizeString(input.q, 100);
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { eventType: re },
      { action: re },
      { "actor.id": re },
      { "actor.email": re },
      { "target.id": re },
      { "request.requestId": re },
      { "request.correlationId": re },
    ];
  }

  const projection: ProjectionType<AuditLogDoc> = {
    _id: 0,
  };

  const [items, total] = await Promise.all([
    AuditLog.find(filter, projection)
      .sort({ timestamp: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<AuditListItem[]>(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getAuditByEventId(eventId: string) {
  const cleanEventId = sanitizeString(eventId, 120);
  if (!cleanEventId) return null;

  return AuditLog.findOne({ eventId: cleanEventId }, { _id: 0 }).lean();
}

export async function logAuditEvent(input: {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  return logAudit(undefined, {
    eventType: "DISPATCH_UPDATE",
    outcome: AUDIT_OUTCOME.SUCCESS,
    action: input.action,
    actor: { id: input.actorId, role: input.actorRole },
    target: { type: input.targetType, id: input.targetId },
    source: { ip: input.ip, userAgent: input.userAgent },
    metadata: input.metadata,
  });
}
