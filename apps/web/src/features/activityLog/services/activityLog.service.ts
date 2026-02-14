import type { ActivityEntityType, ActivityLogEntry } from "../models/activityLog.types";
import { getLguUser } from "../../auth/services/authStorage";

const STORAGE_KEY = "lifeline_lgu_activity_log_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeId() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function actorLabelFromSession() {
  const u = getLguUser();
  if (!u) return "Unknown";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.username || u.email || u.role || "User";
}

function readAll(): ActivityLogEntry[] {
  const raw = safeJsonParse<ActivityLogEntry[]>(localStorage.getItem(STORAGE_KEY));
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .filter((x) => x && typeof x.id === "string" && typeof x.timestamp === "string")
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

function writeAll(entries: ActivityLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listActivityLogEntries(): ActivityLogEntry[] {
  return readAll();
}

export function appendActivityLog(params: {
  actor?: string;
  action: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: string;
}) {
  const entry: ActivityLogEntry = {
    id: makeId(),
    actor: params.actor || actorLabelFromSession(),
    action: String(params.action || "").trim() || "action",
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    timestamp: params.timestamp || new Date().toISOString(),
    metadata: params.metadata ?? null,
  };

  const next = [entry, ...readAll()].slice(0, 500);
  writeAll(next);
  return entry;
}

export function seedActivityLogIfEmpty() {
  const cur = readAll();
  if (cur.length > 0) return;

  const now = new Date();
  const seed: ActivityLogEntry[] = [
    {
      id: makeId(),
      actor: "System",
      action: "LGU portal initialized",
      entityType: "system",
      entityId: null,
      timestamp: now.toISOString(),
      metadata: null,
    },
  ];

  writeAll(seed);
}

