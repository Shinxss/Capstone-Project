import type { LguSettings, NotificationChannelPrefs } from "../models/settings.types";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

const STORAGE_KEY = "lifeline_lgu_settings_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeNotificationChannels(
  rawValue: unknown,
  fallback: NotificationChannelPrefs
): NotificationChannelPrefs {
  // Backward-compatible migration: legacy boolean means web toggle only.
  if (typeof rawValue === "boolean") {
    return { web: rawValue, email: fallback.email };
  }
  if (!rawValue || typeof rawValue !== "object") return fallback;

  const candidate = rawValue as Partial<NotificationChannelPrefs>;
  return {
    web: typeof candidate.web === "boolean" ? candidate.web : fallback.web,
    email: typeof candidate.email === "boolean" ? candidate.email : fallback.email,
  };
}

export function defaultSettings(): LguSettings {
  return {
    notifications: {
      emergencies: { web: true, email: false },
      taskUpdates: { web: true, email: false },
      verificationNeeded: { web: true, email: false },
      announcements: { web: true, email: false },
    },
    ui: {
      defaultPageSize: 25,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function loadSettings(): LguSettings {
  const raw = safeJsonParse<LguSettings>(localStorage.getItem(STORAGE_KEY));
  const d = defaultSettings();

  if (!raw || typeof raw !== "object") return d;

  return {
    notifications: {
      emergencies: normalizeNotificationChannels(
        raw.notifications?.emergencies,
        d.notifications.emergencies
      ),
      taskUpdates: normalizeNotificationChannels(
        raw.notifications?.taskUpdates,
        d.notifications.taskUpdates
      ),
      verificationNeeded: normalizeNotificationChannels(
        raw.notifications?.verificationNeeded,
        d.notifications.verificationNeeded
      ),
      announcements: normalizeNotificationChannels(
        raw.notifications?.announcements,
        d.notifications.announcements
      ),
    },
    ui: {
      defaultPageSize:
        typeof raw.ui?.defaultPageSize === "number" && raw.ui.defaultPageSize > 0
          ? raw.ui.defaultPageSize
          : d.ui.defaultPageSize,
    },
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : d.updatedAt,
  };
}

export function saveSettings(next: Omit<LguSettings, "updatedAt">): LguSettings {
  const saved: LguSettings = { ...next, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

  appendActivityLog({
    action: "Updated settings",
    entityType: "settings",
    entityId: null,
    metadata: { notifications: saved.notifications, ui: saved.ui },
  });

  return saved;
}
