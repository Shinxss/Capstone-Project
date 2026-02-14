import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementDraftInput,
} from "../models/announcements.types";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

const STORAGE_KEY = "lifeline_lgu_announcements_v1";

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

function readAll(): Announcement[] {
  const raw = safeJsonParse<Announcement[]>(localStorage.getItem(STORAGE_KEY));
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .filter((a) => a && typeof a.id === "string")
    .sort((x, y) => String(y.updatedAt).localeCompare(String(x.updatedAt)));
}

function writeAll(next: Announcement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function listAnnouncements(): Announcement[] {
  return readAll();
}

export function seedAnnouncementsIfEmpty() {
  const cur = readAll();
  if (cur.length > 0) return;

  const now = new Date().toISOString();
  const seed: Announcement[] = [
    {
      id: makeId(),
      title: "Welcome to Lifeline LGU Portal",
      body:
        "This is your announcements board. Create internal updates for staff, or publish info for volunteers if your backend supports it.",
      audience: "LGU",
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    },
  ];
  writeAll(seed);
}

export function createAnnouncement(input: AnnouncementDraftInput): Announcement {
  const now = new Date().toISOString();
  const a: Announcement = {
    id: makeId(),
    title: String(input.title || "").trim(),
    body: String(input.body || "").trim(),
    audience: input.audience,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  const next = [a, ...readAll()];
  writeAll(next);

  appendActivityLog({
    action: "Created announcement (draft)",
    entityType: "announcement",
    entityId: a.id,
    metadata: { title: a.title, audience: a.audience, status: a.status },
  });

  return a;
}

export function updateAnnouncement(id: string, patch: Partial<AnnouncementDraftInput>): Announcement {
  const cur = readAll();
  const idx = cur.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Announcement not found");

  const now = new Date().toISOString();
  const updated: Announcement = {
    ...cur[idx],
    title: patch.title !== undefined ? String(patch.title || "").trim() : cur[idx].title,
    body: patch.body !== undefined ? String(patch.body || "").trim() : cur[idx].body,
    audience: (patch.audience as AnnouncementAudience) ?? cur[idx].audience,
    updatedAt: now,
  };

  const next = [...cur];
  next[idx] = updated;
  writeAll(next);

  appendActivityLog({
    action: "Edited announcement",
    entityType: "announcement",
    entityId: updated.id,
    metadata: { title: updated.title, audience: updated.audience, status: updated.status },
  });

  return updated;
}

export function publishAnnouncement(id: string): Announcement {
  const cur = readAll();
  const idx = cur.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Announcement not found");

  const now = new Date().toISOString();
  const updated: Announcement = {
    ...cur[idx],
    status: "PUBLISHED",
    updatedAt: now,
    publishedAt: now,
  };

  const next = [...cur];
  next[idx] = updated;
  writeAll(next);

  appendActivityLog({
    action: "Published announcement",
    entityType: "announcement",
    entityId: updated.id,
    metadata: { title: updated.title, audience: updated.audience },
  });

  return updated;
}

export function unpublishAnnouncement(id: string): Announcement {
  const cur = readAll();
  const idx = cur.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("Announcement not found");

  const now = new Date().toISOString();
  const updated: Announcement = {
    ...cur[idx],
    status: "DRAFT",
    updatedAt: now,
    publishedAt: null,
  };

  const next = [...cur];
  next[idx] = updated;
  writeAll(next);

  appendActivityLog({
    action: "Unpublished announcement",
    entityType: "announcement",
    entityId: updated.id,
    metadata: { title: updated.title, audience: updated.audience },
  });

  return updated;
}

export function deleteAnnouncement(id: string) {
  const cur = readAll();
  const next = cur.filter((x) => x.id !== id);
  writeAll(next);

  appendActivityLog({
    action: "Deleted announcement",
    entityType: "announcement",
    entityId: id,
    metadata: null,
  });
}

