import { api } from "../../../lib/api";
import { getLguUser } from "../../auth/services/authStorage";
import type { AuditLogItem, AuditLogListResponse } from "../../auditTrails/models/auditTrails.types";
import type { ActivityEntityType, ActivityLogEntry } from "../models/activityLog.types";

const ACTIVITY_LOG_PAGE_LIMIT = 200;
const MONGO_OBJECT_ID_TOKEN_RE = /\b[a-f\d]{24}\b/gi;
const MONGO_OBJECT_ID_EXACT_RE = /^[a-f\d]{24}$/i;

const TARGET_TO_ENTITY_TYPE: Record<string, ActivityEntityType> = {
  DISPATCH: "dispatch",
  EMERGENCY: "emergency",
  ANNOUNCEMENT: "announcement",
  PROFILE: "profile",
  SETTINGS: "settings",
  NOTIFICATION: "notification",
  REPORT: "report",
};

function resolveEntityType(item: AuditLogItem): ActivityEntityType {
  const targetType = String(item.target?.type ?? "").trim().toUpperCase();
  if (targetType && targetType in TARGET_TO_ENTITY_TYPE) {
    return TARGET_TO_ENTITY_TYPE[targetType];
  }

  const eventType = String(item.eventType ?? "").trim().toUpperCase();
  if (eventType.includes("DISPATCH")) return "dispatch";
  if (eventType.includes("EMERGENCY")) return "emergency";
  if (eventType.includes("ANNOUNCEMENT")) return "announcement";
  if (eventType.includes("PROFILE")) return "profile";
  if (eventType.includes("NOTIFICATION")) return "notification";
  if (eventType.includes("REPORT")) return "report";
  return "system";
}

function scrubObjectIds(value: string) {
  return value.replace(MONGO_OBJECT_ID_TOKEN_RE, "[id]");
}

function sanitizeMaybeObjectId(value: unknown): string | null {
  const clean = String(value ?? "").trim();
  if (!clean) return null;
  return MONGO_OBJECT_ID_EXACT_RE.test(clean) ? null : clean;
}

function toTitleWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function readMetadata(item: AuditLogItem) {
  return ((item as AuditLogItem & { metadata?: Record<string, unknown> }).metadata ?? {}) as Record<string, unknown>;
}

function sanitizeDisplayText(value: unknown) {
  const clean = scrubObjectIds(String(value ?? "").trim());
  if (!clean || clean === "[id]") return "";
  if (MONGO_OBJECT_ID_EXACT_RE.test(clean)) return "";
  return clean;
}

function deriveNameFromEmail(email: string) {
  if (!email || email.includes("***")) return "";
  const local = email.split("@")[0] ?? "";
  const normalized = local.replace(/[._-]+/g, " ").replace(/\d+/g, " ").trim();
  return toTitleWords(normalized);
}

function resolveActorRole(item: AuditLogItem) {
  const metadata = readMetadata(item);
  const role = sanitizeDisplayText(item.actor?.role) || sanitizeDisplayText(metadata.actorRole) || sanitizeDisplayText(metadata.role);
  return role.toUpperCase() || null;
}

function resolveActorName(item: AuditLogItem) {
  const metadata = readMetadata(item);
  const fullName = sanitizeDisplayText(metadata.fullName);
  if (fullName) return fullName;

  const firstName = sanitizeDisplayText(metadata.firstName);
  const lastName = sanitizeDisplayText(metadata.lastName);
  const fromFirstLast = toTitleWords([firstName, lastName].filter(Boolean).join(" ").trim());
  if (fromFirstLast) return fromFirstLast;

  const actorName = sanitizeDisplayText(metadata.actorName);
  if (actorName) return toTitleWords(actorName);

  const name = sanitizeDisplayText(metadata.name);
  if (name) return toTitleWords(name);

  const email = sanitizeDisplayText(item.actor?.email);
  const fromEmail = deriveNameFromEmail(email);
  if (fromEmail) return fromEmail;

  // If this row is for the currently signed-in actor, use session profile name.
  const actorIdRaw = String(item.actor?.id ?? "").trim();
  const sessionUser = getLguUser();
  const sessionUserId = String(sessionUser?.id ?? "").trim();
  if (actorIdRaw && sessionUserId && actorIdRaw === sessionUserId) {
    const fromSessionName = toTitleWords(
      [sessionUser?.firstName, sessionUser?.lastName]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(" ")
    );
    if (fromSessionName) return fromSessionName;
  }

  const role = resolveActorRole(item);
  if (role) return `${toTitleWords(role)} User`;

  return "System User";
}

function mapAuditItemToActivityEntry(item: AuditLogItem): ActivityLogEntry {
  const action = scrubObjectIds(String(item.action ?? item.eventType ?? "action"));
  const entityId = sanitizeMaybeObjectId(item.target?.id);

  return {
    id: String(item.eventId ?? `${item.timestamp ?? ""}_${item.eventType ?? ""}`),
    actor: resolveActorName(item),
    actorRole: resolveActorRole(item),
    action,
    entityType: resolveEntityType(item),
    entityId,
    timestamp: String(item.timestamp ?? new Date().toISOString()),
    metadata: null,
  };
}

export async function listActivityLogEntries(): Promise<ActivityLogEntry[]> {
  const res = await api.get<AuditLogListResponse>("/api/audit", {
    params: {
      page: 1,
      limit: ACTIVITY_LOG_PAGE_LIMIT,
    },
  });

  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  return items.map(mapAuditItemToActivityEntry);
}

export function appendActivityLog(params: {
  actor?: string;
  action: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: string;
}) {
  void params;
  return null;
}

export function seedActivityLogIfEmpty() {
  // No-op: activity log is now sourced from server audit records.
}
