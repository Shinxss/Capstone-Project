import type { DispatchTask } from "../../tasks/models/tasks.types";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";
import { fetchEmergencyReports } from "../../emergency/services/emergency.service";
import { listAnnouncements } from "../../announcements/services/announcements.service";
import { api } from "../../../lib/api";
import type { LguNotification, NotificationType } from "../models/notifications.types";

export const NOTIFICATIONS_LOCAL_STATE_EVENT = "lifeline:lgu-notifications-local-state";

type NotificationStateMap = Record<
  string,
  {
    read?: boolean;
    archived?: boolean;
  }
>;

function normalizeNotificationIds(ids: string[]) {
  return Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 500);
}

function emitLocalStateEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_LOCAL_STATE_EVENT));
}

async function queryNotificationStates(ids: string[]): Promise<NotificationStateMap> {
  const notificationIds = normalizeNotificationIds(ids);
  if (notificationIds.length === 0) return {};

  try {
    const response = await api.post<{ states?: NotificationStateMap }>("/api/notifications/state/query", {
      ids: notificationIds,
    });
    return response.data?.states ?? {};
  } catch {
    return {};
  }
}

async function updateNotificationReadState(ids: string[], read: boolean) {
  const notificationIds = normalizeNotificationIds(ids);
  if (notificationIds.length === 0) return;

  await api.patch("/api/notifications/state/read", {
    ids: notificationIds,
    read,
  });
  emitLocalStateEvent();
}

async function updateNotificationArchivedState(ids: string[], archived: boolean) {
  const notificationIds = normalizeNotificationIds(ids);
  if (notificationIds.length === 0) return;

  await api.patch("/api/notifications/state/archive", {
    ids: notificationIds,
    archived,
  });
  emitLocalStateEvent();
}

function runStateMutation(action: Promise<void>) {
  void action.catch(() => {
    // Best effort only. UI stays optimistic and re-syncs on refresh/socket events.
  });
}

export function markNotificationRead(id: string) {
  runStateMutation(updateNotificationReadState([id], true));
}

export function markNotificationsRead(ids: string[]) {
  runStateMutation(updateNotificationReadState(ids, true));
}

export function archiveNotification(id: string) {
  runStateMutation(updateNotificationArchivedState([id], true));
}

export function archiveNotifications(ids: string[]) {
  runStateMutation(updateNotificationArchivedState(ids, true));
}

export function unarchiveNotification(id: string) {
  runStateMutation(updateNotificationArchivedState([id], false));
}

export function unarchiveNotifications(ids: string[]) {
  runStateMutation(updateNotificationArchivedState(ids, false));
}

// Backward-compatible aliases.
export function clearNotification(id: string) {
  archiveNotification(id);
}

export function clearNotifications(ids: string[]) {
  archiveNotifications(ids);
}

function safeIso(s?: string | null) {
  const v = String(s || "").trim();
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function buildDispatchNotification(task: DispatchTask): Omit<LguNotification, "read" | "archived"> | null {
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
  // Derived feed: dispatches, emergencies, announcements. Read/archive state comes from DB.
  const [dispatches, emergencies] = await Promise.all([
    fetchLguTasksByStatus("ACCEPTED,DONE,VERIFIED"),
    fetchEmergencyReports(120),
  ]);

  const announcements = listAnnouncements().filter((a) => a.status === "PUBLISHED");

  const items: Array<Omit<LguNotification, "read" | "archived">> = [];

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

  const dedup = new Map<string, Omit<LguNotification, "read" | "archived">>();
  for (const i of items) dedup.set(i.id, i);

  const latest = Array.from(dedup.values())
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 250);

  const states = await queryNotificationStates(latest.map((item) => item.id));
  return latest.map((item) => {
    const state = states[item.id] || {};
    return {
      ...item,
      read: Boolean(state.read),
      archived: Boolean(state.archived),
    };
  });
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
