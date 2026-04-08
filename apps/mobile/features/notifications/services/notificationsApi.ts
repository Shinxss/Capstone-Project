import { api } from "../../../lib/api";
import {
  devMockNotificationsForRole,
  normalizeNotificationRole,
  normalizeNotificationType,
  resolveNotificationCategory,
  resolveNotificationPriority,
  roleSupportsNotificationType,
} from "../constants/notification.constants";
import type {
  MobileNotificationItem,
  PaginatedNotificationResponse,
  NotificationFilter,
  NotificationRole,
  NotificationStatus,
} from "../models/mobileNotification";
import {
  addMobileNotifications,
  deleteMobileNotification,
  deleteMobileNotifications,
  listMobileNotifications,
  markAllMobileNotificationsRead,
  markMobileNotificationRead,
} from "./mobileNotificationsStore";

type GetNotificationsParams = {
  role: NotificationRole;
  filter?: NotificationFilter;
  cursor?: string | null;
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
};

type RawRemoteNotification = {
  id?: unknown;
  type?: unknown;
  title?: unknown;
  body?: unknown;
  createdAt?: unknown;
  readAt?: unknown;
  isRead?: unknown;
  priority?: unknown;
  recipientRole?: unknown;
  actorName?: unknown;
  relatedEntityType?: unknown;
  relatedEntityId?: unknown;
  routeName?: unknown;
  routeParams?: unknown;
  metadata?: unknown;
  iconKey?: unknown;
};

const DEV_MOCKS_ENABLED = __DEV__ && String(process.env.EXPO_PUBLIC_NOTIFICATIONS_MOCK ?? "1").trim() !== "0";
const DEFAULT_PAGE_SIZE = 50;
const LOCAL_SOURCE = "local" as const;
const REMOTE_SOURCE = "backend" as const;

let remoteFeedAvailability: "unknown" | "available" | "missing" = "unknown";

function toIsoOrNow(input: unknown) {
  const value = String(input ?? "").trim();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : new Date().toISOString();
}

function toNotificationStatus(isRead: boolean): NotificationStatus {
  return isRead ? "READ" : "UNREAD";
}

function parseStringRecord(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const mapped = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, value]) => [String(key), String(value ?? "")])
  );
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function mapRemoteNotification(raw: RawRemoteNotification): MobileNotificationItem | null {
  const id = String(raw?.id ?? "").trim();
  const title = String(raw?.title ?? "").trim();
  const body = String(raw?.body ?? "").trim();
  if (!id || !title || !body) return null;

  const type = normalizeNotificationType(raw?.type);
  const category = resolveNotificationCategory(type);
  const priority = resolveNotificationPriority(type);
  const readAtRaw = String(raw?.readAt ?? "").trim();
  const readAt = readAtRaw ? toIsoOrNow(readAtRaw) : null;
  const isRead = Boolean(raw?.isRead ?? readAt);
  const recipientRole = normalizeNotificationRole(raw?.recipientRole);
  const actorName = String(raw?.actorName ?? "").trim() || undefined;
  const relatedEntityType = String(raw?.relatedEntityType ?? "").trim() || undefined;
  const relatedEntityId = String(raw?.relatedEntityId ?? "").trim() || undefined;
  const routeName = String(raw?.routeName ?? "").trim() || undefined;
  const routeParams = parseStringRecord(raw?.routeParams);
  const metadata = parseStringRecord(raw?.metadata);
  const iconKey = String(raw?.iconKey ?? "").trim() || undefined;

  return {
    id,
    type,
    category,
    title,
    body,
    createdAt: toIsoOrNow(raw?.createdAt),
    readAt,
    isRead,
    status: toNotificationStatus(isRead),
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

function parseOffset(params: GetNotificationsParams, pageSize: number) {
  if (typeof params.page === "number" && Number.isFinite(params.page) && params.page >= 1) {
    return Math.floor((params.page - 1) * pageSize);
  }

  const cursorValue = Number(params.cursor ?? "0");
  if (Number.isFinite(cursorValue) && cursorValue >= 0) {
    return Math.floor(cursorValue);
  }

  return 0;
}

function applyRoleGuard(items: MobileNotificationItem[], role: NotificationRole) {
  return items.filter((item) => roleSupportsNotificationType(role, item.type));
}

function applyFilter(items: MobileNotificationItem[], filter: NotificationFilter | undefined, unreadOnly: boolean) {
  return items.filter((item) => {
    if (unreadOnly && item.isRead) return false;
    if (!filter || filter === "ALL") return true;
    if (filter === "UNREAD") return !item.isRead;
    if (filter === "ALERTS") return item.category === "ALERT";
    if (filter === "TASKS") return item.category === "TASK";
    if (filter === "ANNOUNCEMENTS") return item.category === "ANNOUNCEMENT";
    return true;
  });
}

async function seedMockNotifications(role: NotificationRole) {
  if (!DEV_MOCKS_ENABLED) return;
  const current = await listMobileNotifications();
  if (current.length > 0) return;

  const samples = devMockNotificationsForRole(role);
  if (samples.length === 0) return;

  await addMobileNotifications(
    samples.map((item) => ({
      id: item.id,
      type: item.type,
      category: item.category,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      readAt: item.readAt,
      isRead: item.isRead,
      priority: item.priority,
      recipientRole: item.recipientRole,
      actorName: item.actorName,
      relatedEntityType: item.relatedEntityType,
      relatedEntityId: item.relatedEntityId,
      routeName: item.routeName,
      routeParams: item.routeParams,
      metadata: item.metadata,
      iconKey: item.iconKey,
    }))
  );
}

async function loadLocalNotifications(params: GetNotificationsParams): Promise<PaginatedNotificationResponse> {
  await seedMockNotifications(params.role);

  const all = await listMobileNotifications();
  const roleVisible = applyRoleGuard(all, params.role);
  const filtered = applyFilter(roleVisible, params.filter, Boolean(params.unreadOnly));
  const unreadCount = roleVisible.filter((item) => !item.isRead).length;

  const pageSize = Math.max(1, Math.min(200, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const offset = parseOffset(params, pageSize);
  const pageItems = filtered.slice(offset, offset + pageSize);
  const nextCursor = offset + pageSize < filtered.length ? String(offset + pageSize) : null;

  return {
    items: pageItems,
    unreadCount,
    nextCursor,
  };
}

async function tryRemoteNotifications(params: GetNotificationsParams): Promise<PaginatedNotificationResponse | null> {
  if (remoteFeedAvailability === "missing") return null;

  try {
    const res = await api.get<{ items?: RawRemoteNotification[]; nextCursor?: unknown; unreadCount?: unknown }>(
      "/api/notifications/feed",
      {
        params: {
          cursor: params.cursor ?? undefined,
          page: params.page ?? undefined,
          pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
          unreadOnly: params.unreadOnly ? "1" : undefined,
        },
      }
    );

    const mappedItems = Array.isArray(res.data?.items)
      ? res.data.items.map(mapRemoteNotification).filter((item): item is MobileNotificationItem => Boolean(item))
      : [];

    remoteFeedAvailability = "available";
    const roleVisible = applyRoleGuard(mappedItems, params.role);
    const filtered = applyFilter(roleVisible, params.filter, Boolean(params.unreadOnly));
    const unreadCount = Number(res.data?.unreadCount);

    return {
      items: filtered,
      unreadCount: Number.isFinite(unreadCount) ? unreadCount : roleVisible.filter((item) => !item.isRead).length,
      nextCursor: typeof res.data?.nextCursor === "string" ? res.data.nextCursor : null,
    };
  } catch (error: any) {
    const status = Number(error?.response?.status);
    if (status === 401 || status === 403 || status === 404 || status === 405 || status === 501) {
      remoteFeedAvailability = "missing";
    }
    return null;
  }
}

export async function getNotifications(params: GetNotificationsParams): Promise<PaginatedNotificationResponse> {
  const remote = await tryRemoteNotifications(params);
  if (remote) return remote;
  return loadLocalNotifications(params);
}

export async function markNotificationRead(id: string): Promise<void> {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) return;

  await markMobileNotificationRead(normalizedId, true);

  if (remoteFeedAvailability !== "available") return;

  // TODO(server): Remove role restrictions or add user inbox read endpoint for all roles.
  await api.patch("/api/notifications/state/read", { ids: [normalizedId], read: true }).catch(() => undefined);
}

export async function markAllNotificationsRead(): Promise<void> {
  const current = await listMobileNotifications();
  const unreadIds = current.filter((item) => !item.isRead).map((item) => item.id);
  if (unreadIds.length === 0) return;

  await markAllMobileNotificationsRead();

  if (remoteFeedAvailability !== "available") return;
  await api.patch("/api/notifications/state/read", { ids: unreadIds, read: true }).catch(() => undefined);
}

export async function deleteNotification(id: string): Promise<void> {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) return;

  await deleteMobileNotification(normalizedId);

  if (remoteFeedAvailability !== "available") return;
  await api.patch("/api/notifications/state/archive", { ids: [normalizedId], archived: true }).catch(() => undefined);
}

export async function deleteNotifications(ids: string[]): Promise<void> {
  const normalizedIds = ids.map((id) => String(id ?? "").trim()).filter(Boolean);
  if (normalizedIds.length === 0) return;

  await deleteMobileNotifications(normalizedIds);

  if (remoteFeedAvailability !== "available") return;
  await api.patch("/api/notifications/state/archive", { ids: normalizedIds, archived: true }).catch(() => undefined);
}

export async function getUnreadCount(roleRaw: unknown): Promise<number> {
  const role = normalizeNotificationRole(roleRaw);
  const all = await listMobileNotifications();
  const roleVisible = applyRoleGuard(all, role);
  return roleVisible.filter((item) => !item.isRead).length;
}

export const notificationsDataSource = {
  primary: LOCAL_SOURCE,
  fallback: REMOTE_SOURCE,
};
