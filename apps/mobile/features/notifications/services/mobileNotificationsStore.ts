import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import {
  normalizeNotificationRole,
  normalizeNotificationType,
  resolveNotificationCategory,
  resolveNotificationPriority,
} from "../constants/notification.constants";
import type {
  MobileNotificationInsert,
  MobileNotificationItem,
  MobileNotificationMeta,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from "../models/mobileNotification";

type NotificationsListener = () => void;

const MAX_NOTIFICATIONS = 300;
const notificationsListeners = new Set<NotificationsListener>();

let loaded = false;
let items: MobileNotificationItem[] = [];
let meta: MobileNotificationMeta = {
  knownHazardZoneIds: [],
  seenAnnouncementIds: [],
  lastWeatherSignature: null,
  volunteerStatusByUserId: {},
  hazardsPrimed: false,
  announcementsPrimed: false,
};

let operationQueue: Promise<void> = Promise.resolve();

function enqueue(work: () => Promise<void>) {
  operationQueue = operationQueue.then(work).catch(() => undefined);
  return operationQueue;
}

function emitNotificationsChange() {
  for (const listener of notificationsListeners) {
    listener();
  }
}

function isValidIsoDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

function isoOrNow(input?: string | null) {
  return isValidIsoDate(input) ? String(input).trim() : new Date().toISOString();
}

function normalizeReadState(raw: any) {
  const readAtCandidate = isValidIsoDate(raw?.readAt)
    ? String(raw.readAt).trim()
    : null;
  const readFlag = Boolean(raw?.isRead ?? raw?.read);
  const isRead = readAtCandidate ? true : readFlag;
  const readAt = isRead ? readAtCandidate ?? new Date().toISOString() : null;
  const status: NotificationStatus = isRead ? "READ" : "UNREAD";

  return { isRead, readAt, status };
}

function parseStringRecord(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const mapped = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
      String(key).trim(),
      String(value ?? "").trim(),
    ])
  );
  if (Object.keys(mapped).length === 0) return undefined;
  return mapped;
}

function parseNotificationItem(raw: any): MobileNotificationItem | null {
  const id = String(raw?.id ?? "").trim();
  const title = String(raw?.title ?? "").trim();
  const body = String(raw?.body ?? "").trim();
  if (!id || !title || !body) return null;

  const type = normalizeNotificationType(raw?.type);
  const categoryRaw = String(raw?.category ?? "").trim().toUpperCase();
  const category =
    categoryRaw === "UPDATE" ||
    categoryRaw === "ALERT" ||
    categoryRaw === "TASK" ||
    categoryRaw === "ANNOUNCEMENT" ||
    categoryRaw === "SYSTEM"
      ? (categoryRaw as NotificationCategory)
      : resolveNotificationCategory(type);
  const priorityRaw = String(raw?.priority ?? "").trim().toUpperCase();
  const priority =
    priorityRaw === "LOW" ||
    priorityRaw === "NORMAL" ||
    priorityRaw === "HIGH" ||
    priorityRaw === "CRITICAL"
      ? (priorityRaw as NotificationPriority)
      : resolveNotificationPriority(type);
  const createdAt = isoOrNow(raw?.createdAt);
  const read = normalizeReadState(raw);
  const metadata = parseStringRecord(raw?.metadata);
  const routeName = String(raw?.routeName ?? raw?.targetPath ?? "").trim() || undefined;
  const routeParams = parseStringRecord(raw?.routeParams ?? raw?.targetParams);
  const relatedEntityId = String(raw?.relatedEntityId ?? "").trim() || undefined;
  const relatedEntityType = String(raw?.relatedEntityType ?? "").trim() || undefined;
  const recipientRole = normalizeNotificationRole(raw?.recipientRole);
  const actorName = String(raw?.actorName ?? "").trim() || undefined;
  const iconKey = String(raw?.iconKey ?? "").trim() || undefined;

  return {
    id,
    type,
    category,
    title,
    body,
    createdAt,
    readAt: read.readAt,
    isRead: read.isRead,
    status: read.status,
    priority,
    recipientRole,
    ...(actorName ? { actorName } : {}),
    ...(relatedEntityType ? { relatedEntityType: relatedEntityType as MobileNotificationItem["relatedEntityType"] } : {}),
    ...(relatedEntityId ? { relatedEntityId } : {}),
    ...(routeName ? { routeName } : {}),
    ...(routeParams ? { routeParams } : {}),
    ...(metadata ? { metadata } : {}),
    ...(iconKey ? { iconKey } : {}),
  };
}

function sanitizeItems(next: MobileNotificationItem[]) {
  return [...next]
    .filter((item) => Boolean(item.id) && Boolean(item.title) && Boolean(item.body))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_NOTIFICATIONS);
}

function parseMeta(raw: any): MobileNotificationMeta {
  const knownHazardZoneIds = Array.isArray(raw?.knownHazardZoneIds)
    ? raw.knownHazardZoneIds.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)
    : [];
  const seenAnnouncementIds = Array.isArray(raw?.seenAnnouncementIds)
    ? raw.seenAnnouncementIds.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)
    : [];
  const lastWeatherSignature =
    typeof raw?.lastWeatherSignature === "string" && raw.lastWeatherSignature.trim()
      ? raw.lastWeatherSignature.trim()
      : null;

  const volunteerStatusByUserId =
    raw?.volunteerStatusByUserId && typeof raw.volunteerStatusByUserId === "object"
      ? Object.fromEntries(
          Object.entries(raw.volunteerStatusByUserId).map(([key, value]) => [
            String(key).trim(),
            String(value ?? "").trim().toUpperCase(),
          ])
        )
      : {};

  const hazardsPrimed = Boolean(raw?.hazardsPrimed);
  const announcementsPrimed = Boolean(raw?.announcementsPrimed);

  return {
    knownHazardZoneIds,
    seenAnnouncementIds,
    lastWeatherSignature,
    volunteerStatusByUserId,
    hazardsPrimed,
    announcementsPrimed,
  };
}

async function persistItems() {
  await AsyncStorage.setItem(STORAGE_KEYS.MOBILE_NOTIFICATIONS, JSON.stringify(items));
}

async function persistMeta() {
  await AsyncStorage.setItem(STORAGE_KEYS.MOBILE_NOTIFICATIONS_META, JSON.stringify(meta));
}

async function ensureLoaded() {
  if (loaded) return;

  const [itemsRaw, metaRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.MOBILE_NOTIFICATIONS),
    AsyncStorage.getItem(STORAGE_KEYS.MOBILE_NOTIFICATIONS_META),
  ]);

  if (itemsRaw) {
    try {
      const parsed = JSON.parse(itemsRaw);
      if (Array.isArray(parsed)) {
        items = sanitizeItems(
          parsed
            .map(parseNotificationItem)
            .filter((entry): entry is MobileNotificationItem => Boolean(entry))
        );
      }
    } catch {
      items = [];
    }
  }

  if (metaRaw) {
    try {
      meta = parseMeta(JSON.parse(metaRaw));
    } catch {
      meta = parseMeta(null);
    }
  }

  loaded = true;
}

export function subscribeMobileNotifications(listener: NotificationsListener) {
  notificationsListeners.add(listener);
  return () => {
    notificationsListeners.delete(listener);
  };
}

export async function listMobileNotifications(): Promise<MobileNotificationItem[]> {
  await ensureLoaded();
  return [...items];
}

export async function getMobileNotificationsMeta(): Promise<MobileNotificationMeta> {
  await ensureLoaded();
  return {
    ...meta,
    knownHazardZoneIds: [...meta.knownHazardZoneIds],
    seenAnnouncementIds: [...meta.seenAnnouncementIds],
    volunteerStatusByUserId: { ...meta.volunteerStatusByUserId },
  };
}

export async function updateMobileNotificationsMeta(
  updater: (current: MobileNotificationMeta) => MobileNotificationMeta
): Promise<MobileNotificationMeta> {
  await ensureLoaded();

  let snapshot: MobileNotificationMeta = meta;
  await enqueue(async () => {
    const next = parseMeta(updater(meta));
    meta = next;
    snapshot = next;
    await persistMeta();
  });

  return {
    ...snapshot,
    knownHazardZoneIds: [...snapshot.knownHazardZoneIds],
    seenAnnouncementIds: [...snapshot.seenAnnouncementIds],
    volunteerStatusByUserId: { ...snapshot.volunteerStatusByUserId },
  };
}

function normalizeInsert(entry: MobileNotificationInsert): MobileNotificationItem | null {
  const normalizedId = String(entry.id ?? "").trim();
  const normalizedTitle = String(entry.title ?? "").trim();
  const normalizedBody = String(entry.body ?? "").trim();
  if (!normalizedId || !normalizedTitle || !normalizedBody) return null;

  const type = normalizeNotificationType(entry.type);
  const createdAt = isoOrNow(entry.createdAt);
  const baseReadAt = entry.readAt;
  const shouldRead = Boolean(entry.isRead ?? entry.read ?? (isValidIsoDate(baseReadAt) ? true : false));
  const readAt = shouldRead ? isoOrNow(baseReadAt ?? createdAt) : null;
  const status: NotificationStatus = shouldRead ? "READ" : "UNREAD";
  const routeName =
    String(entry.routeName ?? entry.targetPath ?? "").trim() ||
    undefined;
  const routeParams = parseStringRecord(entry.routeParams ?? entry.targetParams);
  const metadata = parseStringRecord(entry.metadata);
  const relatedEntityType = String(entry.relatedEntityType ?? "").trim() || undefined;
  const relatedEntityId = String(entry.relatedEntityId ?? "").trim() || undefined;
  const actorName = String(entry.actorName ?? "").trim() || undefined;
  const iconKey = String(entry.iconKey ?? "").trim() || undefined;
  const recipientRole = normalizeNotificationRole(entry.recipientRole);

  return {
    id: normalizedId,
    type,
    category: entry.category ?? resolveNotificationCategory(type),
    title: normalizedTitle,
    body: normalizedBody,
    createdAt,
    readAt,
    isRead: shouldRead,
    status,
    priority: entry.priority ?? resolveNotificationPriority(type),
    recipientRole,
    ...(actorName ? { actorName } : {}),
    ...(relatedEntityType ? { relatedEntityType: relatedEntityType as MobileNotificationItem["relatedEntityType"] } : {}),
    ...(relatedEntityId ? { relatedEntityId } : {}),
    ...(routeName ? { routeName } : {}),
    ...(routeParams ? { routeParams } : {}),
    ...(metadata ? { metadata } : {}),
    ...(iconKey ? { iconKey } : {}),
  };
}

export async function addMobileNotification(entry: MobileNotificationInsert): Promise<void> {
  await ensureLoaded();
  const nextItem = normalizeInsert(entry);
  if (!nextItem) return;

  await enqueue(async () => {
    const existingIndex = items.findIndex((item) => item.id === nextItem.id);
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      items[existingIndex] = {
        ...existing,
        ...nextItem,
        isRead: existing.isRead || nextItem.isRead,
        readAt: existing.readAt ?? nextItem.readAt,
        status: existing.isRead || nextItem.isRead ? "READ" : "UNREAD",
      };
    } else {
      items = [nextItem, ...items];
    }

    items = sanitizeItems(items);
    await persistItems();
    emitNotificationsChange();
  });
}

export async function addMobileNotifications(entries: MobileNotificationInsert[]): Promise<void> {
  for (const entry of entries) {
    await addMobileNotification(entry);
  }
}

export async function markMobileNotificationRead(id: string, read = true): Promise<void> {
  await ensureLoaded();
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) return;

  await enqueue(async () => {
    const index = items.findIndex((item) => item.id === normalizedId);
    if (index < 0) return;

    if (items[index].isRead === read) return;

    items[index] = {
      ...items[index],
      isRead: read,
      status: read ? "READ" : "UNREAD",
      readAt: read ? new Date().toISOString() : null,
    };

    await persistItems();
    emitNotificationsChange();
  });
}

export async function markAllMobileNotificationsRead(): Promise<void> {
  await ensureLoaded();

  await enqueue(async () => {
    const hasUnread = items.some((item) => !item.isRead);
    if (!hasUnread) return;
    const nowIso = new Date().toISOString();
    items = items.map((item) =>
      item.isRead
        ? item
        : {
            ...item,
            isRead: true,
            status: "READ",
            readAt: nowIso,
          }
    );
    await persistItems();
    emitNotificationsChange();
  });
}

export async function deleteMobileNotification(id: string): Promise<void> {
  await ensureLoaded();
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) return;

  await enqueue(async () => {
    const next = items.filter((item) => item.id !== normalizedId);
    if (next.length === items.length) return;
    items = next;
    await persistItems();
    emitNotificationsChange();
  });
}

export async function deleteMobileNotifications(ids: string[]): Promise<void> {
  await ensureLoaded();
  const idSet = new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean));
  if (idSet.size === 0) return;

  await enqueue(async () => {
    const next = items.filter((item) => !idSet.has(item.id));
    if (next.length === items.length) return;
    items = next;
    await persistItems();
    emitNotificationsChange();
  });
}
