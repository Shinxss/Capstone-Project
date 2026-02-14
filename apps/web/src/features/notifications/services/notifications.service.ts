import type { DispatchTask } from "../../tasks/models/tasks.types";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";
import { fetchEmergencyReports } from "../../emergency/services/emergency.service";
import { listAnnouncements } from "../../announcements/services/announcements.service";
import type { LguNotification, NotificationType } from "../models/notifications.types";

const READ_KEY = "lifeline_lgu_notifications_read_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readReadIds(): string[] {
  const raw = safeJsonParse<string[]>(localStorage.getItem(READ_KEY));
  return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
}

function writeReadIds(ids: string[]) {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(new Set(ids)).slice(0, 5000)));
}

export function markNotificationRead(id: string) {
  const cur = readReadIds();
  if (cur.includes(id)) return;
  writeReadIds([id, ...cur]);
}

export function markNotificationsRead(ids: string[]) {
  const cur = readReadIds();
  writeReadIds([...ids, ...cur]);
}

function safeIso(s?: string | null) {
  const v = String(s || "").trim();
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function buildDispatchNotification(task: DispatchTask): Omit<LguNotification, "read"> | null {
  const status = String(task.status || "").toUpperCase();
  const dispatchId = String(task.id || "").trim();
  const emergencyType = String(task.emergency?.emergencyType || "Emergency").trim();
  const barangay = task.emergency?.barangayName ? String(task.emergency.barangayName) : "";
  const volunteer = task.volunteer?.name ? String(task.volunteer.name) : "Volunteer";

  if (!dispatchId) return null;

  if (status === "DONE") {
    const createdAt = safeIso(task.completedAt) || safeIso(task.updatedAt) || new Date().toISOString();
    return {
      id: `dispatch:${dispatchId}:verification`,
      type: "verification",
      title: `Verification needed: ${emergencyType}`,
      message: `${volunteer} marked a dispatch as done.${barangay ? ` Barangay: ${barangay}.` : ""}`,
      createdAt,
      source: { kind: "dispatch", id: dispatchId },
    };
  }

  if (status === "ACCEPTED") {
    const createdAt = safeIso(task.respondedAt) || safeIso(task.updatedAt) || new Date().toISOString();
    return {
      id: `dispatch:${dispatchId}:accepted`,
      type: "task",
      title: `Dispatch accepted: ${emergencyType}`,
      message: `${volunteer} accepted a dispatch.${barangay ? ` Barangay: ${barangay}.` : ""}`,
      createdAt,
      source: { kind: "dispatch", id: dispatchId },
    };
  }

  if (status === "VERIFIED") {
    const createdAt = safeIso(task.verifiedAt) || safeIso(task.updatedAt) || new Date().toISOString();
    return {
      id: `dispatch:${dispatchId}:verified`,
      type: "task",
      title: `Dispatch verified: ${emergencyType}`,
      message: `A dispatch was verified by the LGU.${barangay ? ` Barangay: ${barangay}.` : ""}`,
      createdAt,
      source: { kind: "dispatch", id: dispatchId },
    };
  }

  return null;
}

function normalizeTypeKey(t: NotificationType | "ALL") {
  return String(t).toUpperCase();
}

export async function fetchLguNotifications(): Promise<LguNotification[]> {
  // Derived feed: dispatches, emergencies, announcements. Read state is local.
  const [dispatches, emergencies] = await Promise.all([
    fetchLguTasksByStatus("ACCEPTED,DONE,VERIFIED"),
    fetchEmergencyReports(120),
  ]);

  const announcements = listAnnouncements().filter((a) => a.status === "PUBLISHED");
  const readIds = new Set(readReadIds());

  const items: Array<Omit<LguNotification, "read">> = [];

  for (const t of dispatches) {
    const n = buildDispatchNotification(t);
    if (n) items.push(n);
  }

  for (const e of emergencies) {
    const emergencyId = String(e?._id || "").trim();
    if (!emergencyId) continue;

    const createdAt = safeIso(e.reportedAt) || safeIso(e.createdAt) || safeIso(e.updatedAt) || new Date().toISOString();
    const emergencyType = String(e.emergencyType || "Emergency").trim();
    const barangay = e.barangayName ? String(e.barangayName) : "";
    const notes = e.notes ? String(e.notes) : "";

    items.push({
      id: `emergency:${emergencyId}`,
      type: "emergency",
      title: `Emergency reported: ${emergencyType}`,
      message: [barangay ? `Barangay: ${barangay}.` : "", notes].filter(Boolean).join(" "),
      createdAt,
      source: { kind: "emergency", id: emergencyId },
    });
  }

  for (const a of announcements) {
    const createdAt = safeIso(a.publishedAt) || safeIso(a.updatedAt) || safeIso(a.createdAt) || new Date().toISOString();
    items.push({
      id: `announcement:${a.id}`,
      type: "announcement",
      title: `Announcement: ${a.title}`,
      message: a.body.slice(0, 140).trim() + (a.body.length > 140 ? "..." : ""),
      createdAt,
      source: { kind: "announcement", id: a.id },
    });
  }

  const dedup = new Map<string, Omit<LguNotification, "read">>();
  for (const i of items) dedup.set(i.id, i);

  const list = Array.from(dedup.values())
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 250)
    .map((n) => ({
      ...n,
      read: readIds.has(n.id),
    }));

  return list;
}

export function notificationTypeOptions(): Array<{ value: NotificationType | "ALL"; label: string }> {
  return [
    { value: "ALL", label: "All types" },
    { value: "emergency", label: "Emergencies" },
    { value: "verification", label: "Verification" },
    { value: "task", label: "Task updates" },
    { value: "announcement", label: "Announcements" },
    { value: "system", label: "System" },
  ];
}

export function matchesNotificationType(filter: NotificationType | "ALL", t: NotificationType) {
  return normalizeTypeKey(filter) === "ALL" || normalizeTypeKey(filter) === normalizeTypeKey(t);
}

