import type { Request } from "express";
import { AuditLog } from "./audit.model";

type AuditMetadata = Record<string, unknown> | undefined;

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /(password|token|secret|otp|authorization)/i;

type AuditInput = {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: AuditMetadata;
  ip?: string;
  userAgent?: string;
};

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeMetadata(entry));
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string" && value.length > 2000) {
      return value.slice(0, 2000);
    }
    return value;
  }

  const safe: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) {
      safe[key] = REDACTED;
      continue;
    }
    safe[key] = sanitizeMetadata(raw);
  }
  return safe;
}

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(",")[0].trim();
  }

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip ?? "";
}

export function getAuditActor(req: Request) {
  const actorId = String((req as any).user?.id ?? req.userId ?? "").trim();
  const actorRole = String((req as any).user?.role ?? req.role ?? "").trim();
  return { actorId, actorRole };
}

export function getAuditRequestContext(req: Request) {
  return {
    ip: getClientIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
  };
}

export async function logAuditEvent(input: AuditInput) {
  try {
    await AuditLog.create({
      actorId: input.actorId || "",
      actorRole: input.actorRole || "",
      action: input.action,
      targetType: input.targetType || "",
      targetId: input.targetId || "",
      metadata: sanitizeMetadata(input.metadata ?? {}),
      ip: input.ip || "",
      userAgent: input.userAgent || "",
    });
  } catch {
    // Avoid breaking primary flow if audit logging fails.
  }
}
