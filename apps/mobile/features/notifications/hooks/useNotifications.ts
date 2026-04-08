import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  NOTIFICATION_DEFAULT_ROUTE,
  NOTIFICATION_FILTER_ITEMS,
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABELS,
  normalizeNotificationRole,
} from "../constants/notification.constants";
import type {
  MobileNotificationItem,
  NotificationFilter,
  NotificationRole,
} from "../models/mobileNotification";
import {
  deleteNotification,
  deleteNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationsApi";
import { subscribeMobileNotifications } from "../services/mobileNotificationsStore";

type NotificationSectionLabel = "Today" | "Yesterday" | "Older";

export type NotificationSection = {
  key: string;
  label: NotificationSectionLabel;
  items: MobileNotificationItem[];
};

type EmptyStateVariant = "NO_NOTIFICATIONS" | "NO_UNREAD" | "NO_FILTER_RESULTS" | "NO_SEARCH_RESULTS";

type NotificationEmptyState = {
  variant: EmptyStateVariant;
  title: string;
  body: string;
};

export type NotificationRouteTarget = {
  pathname: string;
  params?: Record<string, string>;
};

export type NotificationOpenResult =
  | { kind: "navigate"; target: NotificationRouteTarget }
  | { kind: "detail"; item: MobileNotificationItem };

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function sectionLabel(createdAt: string, now: Date): NotificationSectionLabel {
  const targetDate = new Date(createdAt);
  if (!Number.isFinite(targetDate.getTime())) return "Older";

  const nowDay = startOfDay(now);
  const targetDay = startOfDay(targetDate);
  const dayDiff = Math.floor((nowDay - targetDay) / (24 * 60 * 60 * 1000));

  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return "Older";
}

function groupSections(items: MobileNotificationItem[]): NotificationSection[] {
  const order: NotificationSectionLabel[] = ["Today", "Yesterday", "Older"];
  const grouped = new Map<NotificationSectionLabel, MobileNotificationItem[]>();
  const now = new Date();

  for (const item of items) {
    const label = sectionLabel(item.createdAt, now);
    const group = grouped.get(label);
    if (group) {
      group.push(item);
    } else {
      grouped.set(label, [item]);
    }
  }

  return order
    .map((label) => ({
      key: label.toLowerCase(),
      label,
      items: grouped.get(label) ?? [],
    }))
    .filter((section) => section.items.length > 0);
}

function matchesFilter(item: MobileNotificationItem, filter: NotificationFilter) {
  if (filter === "ALL") return true;
  if (filter === "UNREAD") return !item.isRead;
  if (filter === "ALERTS") return item.category === "ALERT";
  if (filter === "TASKS") return item.category === "TASK";
  if (filter === "ANNOUNCEMENTS") return item.category === "ANNOUNCEMENT";
  return true;
}

function applyFilterAndSearch(items: MobileNotificationItem[], filter: NotificationFilter, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    if (!matchesFilter(item, filter)) return false;
    if (!normalizedQuery) return true;
    const haystack = `${item.title} ${item.body} ${item.actorName ?? ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function notificationTime(createdAt: string) {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return "";

  const now = new Date();
  if (startOfDay(date) === startOfDay(now)) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function buildEmptyState(
  allItems: MobileNotificationItem[],
  filteredItems: MobileNotificationItem[],
  filter: NotificationFilter,
  query: string
): NotificationEmptyState {
  const hasSearch = Boolean(query.trim());
  if (hasSearch && filteredItems.length === 0) {
    return {
      variant: "NO_SEARCH_RESULTS",
      title: "No matching notifications",
      body: "Try another keyword.",
    };
  }

  if (allItems.length === 0) {
    return {
      variant: "NO_NOTIFICATIONS",
      title: "No notifications yet",
      body: "You are all caught up. New updates and alerts will appear here.",
    };
  }

  if (filter === "UNREAD" && filteredItems.length === 0) {
    return {
      variant: "NO_UNREAD",
      title: "No unread notifications",
      body: "Everything has been read.",
    };
  }

  return {
    variant: "NO_FILTER_RESULTS",
    title: "No notifications in this tab",
    body: "Try a different filter.",
  };
}

function resolveTarget(item: MobileNotificationItem): NotificationRouteTarget | null {
  const metadataRequestId = String(item.metadata?.requestId ?? "").trim();
  const entityRequestId =
    item.relatedEntityType === "REQUEST" ? String(item.relatedEntityId ?? "").trim() : "";
  const requestId = entityRequestId || metadataRequestId;

  if (item.routeName) {
    if (item.routeName === "/my-request-tracking" && !requestId && !item.routeParams?.id) {
      return { pathname: "/my-requests" };
    }

    if (item.routeName === "/my-request-tracking") {
      const id = String(item.routeParams?.id ?? requestId).trim();
      if (id) return { pathname: "/my-request-tracking", params: { id } };
    }

    return {
      pathname: item.routeName,
      ...(item.routeParams ? { params: item.routeParams } : {}),
    };
  }

  const fallbackRoute = NOTIFICATION_DEFAULT_ROUTE[item.type];
  if (!fallbackRoute) return null;

  if (fallbackRoute === "/my-request-tracking") {
    if (!requestId) return { pathname: "/my-requests" };
    return { pathname: fallbackRoute, params: { id: requestId } };
  }

  return { pathname: fallbackRoute };
}

export function useNotifications() {
  const { mode, user } = useAuth();
  const [items, setItems] = useState<MobileNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [query, setQuery] = useState("");
  const role = useMemo<NotificationRole>(() => normalizeNotificationRole(user?.role), [user?.role]);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) setLoading(true);

      try {
        const response = await getNotifications({
          role,
          filter: "ALL",
          page: 1,
          pageSize: 300,
          unreadOnly: false,
        });
        setItems(response.items);
        setError(null);
      } catch (loadError: any) {
        setError(String(loadError?.message ?? "Failed to load notifications"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [role]
  );

  useEffect(() => {
    if (mode === "anonymous") {
      setItems([]);
      setLoading(false);
      return;
    }
    void load();
  }, [load, mode]);

  useEffect(() => {
    return subscribeMobileNotifications(() => {
      void load({ silent: true });
    });
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const filteredItems = useMemo(
    () => applyFilterAndSearch(items, filter, query),
    [filter, items, query]
  );

  const sections = useMemo(() => groupSections(filteredItems), [filteredItems]);
  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const unreadByFilter = useMemo(() => {
    const entries = NOTIFICATION_FILTER_ITEMS.map((item) => {
      const count = items.filter((entry) => !entry.isRead && matchesFilter(entry, item.key)).length;
      return [item.key, count] as const;
    });
    return Object.fromEntries(entries) as Record<NotificationFilter, number>;
  }, [items]);

  const emptyState = useMemo(
    () => buildEmptyState(items, filteredItems, filter, query),
    [filter, filteredItems, items, query]
  );

  const markRead = useCallback(async (id: string) => {
    const normalizedId = String(id ?? "").trim();
    if (!normalizedId) return;

    let previousSnapshot: MobileNotificationItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.map((item) =>
        item.id === normalizedId && !item.isRead
          ? {
              ...item,
              isRead: true,
              status: "READ",
              readAt: new Date().toISOString(),
            }
          : item
      );
    });

    try {
      await markNotificationRead(normalizedId);
    } catch (markError: any) {
      setItems(previousSnapshot);
      throw markError;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const nowIso = new Date().toISOString();

    let previousSnapshot: MobileNotificationItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.map((item) =>
        item.isRead
          ? item
          : {
              ...item,
              isRead: true,
              status: "READ",
              readAt: nowIso,
            }
      );
    });

    try {
      await markAllNotificationsRead();
    } catch (markError: any) {
      setItems(previousSnapshot);
      throw markError;
    }
  }, [unreadCount]);

  const deleteOne = useCallback(async (id: string) => {
    const normalizedId = String(id ?? "").trim();
    if (!normalizedId) return;

    let previousSnapshot: MobileNotificationItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.filter((item) => item.id !== normalizedId);
    });

    try {
      await deleteNotification(normalizedId);
    } catch (deleteError: any) {
      setItems(previousSnapshot);
      throw deleteError;
    }
  }, []);

  const deleteMany = useCallback(async (ids: string[]) => {
    const normalizedIds = new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean));
    if (normalizedIds.size === 0) return;

    let previousSnapshot: MobileNotificationItem[] = [];
    setItems((prev) => {
      previousSnapshot = prev;
      return prev.filter((item) => !normalizedIds.has(item.id));
    });

    try {
      await deleteNotifications(Array.from(normalizedIds));
    } catch (deleteError: any) {
      setItems(previousSnapshot);
      throw deleteError;
    }
  }, []);

  const openNotification = useCallback(
    async (item: MobileNotificationItem): Promise<NotificationOpenResult> => {
      if (!item.isRead) {
        await markRead(item.id);
      }

      const target = resolveTarget(item);
      if (!target) {
        return { kind: "detail", item };
      }

      return {
        kind: "navigate",
        target,
      };
    },
    [markRead]
  );

  const canNavigate = useCallback((item: MobileNotificationItem) => {
    return Boolean(resolveTarget(item));
  }, []);

  const titleForItem = useCallback((item: MobileNotificationItem) => {
    const fallback = NOTIFICATION_TYPE_LABELS[item.type] ?? "Notification";
    return item.title.trim() || fallback;
  }, []);

  const iconForItem = useCallback((item: MobileNotificationItem) => {
    const iconKey = item.iconKey?.trim();
    if (iconKey) return iconKey;
    return NOTIFICATION_TYPE_ICON[item.type] ?? "notifications-outline";
  }, []);

  return {
    role,
    loading,
    refreshing,
    error,
    items,
    filteredItems,
    sections,
    emptyState,
    filter,
    setFilter,
    query,
    setQuery,
    unreadCount,
    unreadByFilter,
    formatTime: notificationTime,
    iconForItem,
    titleForItem,
    onRefresh,
    retry: load,
    markRead,
    markAllRead,
    deleteOne,
    deleteMany,
    openNotification,
    canNavigate,
  };
}
