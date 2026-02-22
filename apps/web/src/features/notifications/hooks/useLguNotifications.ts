import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LguNotification,
  NotificationsFilters,
  NotificationTab,
  NotificationType,
} from "../models/notifications.types";
import {
  archiveNotification,
  archiveNotifications,
  fetchLguNotifications,
  markNotificationRead,
  markNotificationsRead,
  matchesNotificationType,
  notificationTypeOptions,
  unarchiveNotification,
  unarchiveNotifications,
} from "../services/notifications.service";
import { getLguToken } from "../../auth/services/authStorage";
import {
  createNotificationsSocket,
  type NotificationsRefreshPayload,
} from "../services/notifications.socket";

const defaultFilters: NotificationsFilters = {
  scope: "ALL",
  type: "ALL",
  tab: "ALL",
  query: "",
  sort: "NEWEST",
};

const tabOptionsBase: Array<{ value: NotificationTab; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "SOS", label: "SOS" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "SYSTEM", label: "System" },
];

function supportsBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

function isSosNotification(notification: LguNotification) {
  const sourceId = String(notification.source?.id || "").toLowerCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (notification.type !== "emergency") return false;
  return sourceId.includes("sos") || text.includes("sos");
}

function matchesNotificationTab(tab: NotificationTab, notification: LguNotification) {
  if (tab === "ALL") return true;
  if (tab === "SOS") return isSosNotification(notification);
  if (tab === "EMERGENCY") return notification.type === "emergency";
  if (tab === "VOLUNTEER") return notification.type === "task" || notification.type === "verification";
  if (tab === "SYSTEM") return notification.type === "system" || notification.type === "announcement";
  return true;
}

function notificationSearchText(notification: LguNotification) {
  return `${notification.title} ${notification.message} ${notification.source?.id || ""}`.toLowerCase();
}

function notificationTimestamp(notification: LguNotification) {
  const time = new Date(notification.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function notificationBodyFromReason(reason: string) {
  const normalized = String(reason || "").trim().toLowerCase();
  if (normalized === "emergency_reported") return "A new emergency report needs attention.";
  if (normalized === "dispatch_accepted") return "A dispatch has been accepted.";
  if (normalized === "dispatch_completed") return "A dispatch has been completed and may need verification.";
  if (normalized === "dispatch_verified") return "A dispatch has been verified.";
  return "There is a new notification update.";
}

function maybeShowBrowserNotification(payload: NotificationsRefreshPayload) {
  if (!supportsBrowserNotifications()) return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification("Lifeline Notification", {
    body: notificationBodyFromReason(payload.reason),
    tag: `lifeline-notify-${payload.reason}`,
  });

  notification.onclick = () => {
    window.focus();
    if (window.location.pathname !== "/lgu/notifications") {
      window.location.assign("/lgu/notifications");
    }
    notification.close();
  };
}

export function useLguNotifications() {
  const [items, setItems] = useState<LguNotification[]>([]);
  const [filters, setFilters] = useState<NotificationsFilters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<LguNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLguNotifications();
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supportsBrowserNotifications()) return;
    if (Notification.permission !== "default") return;
    void Notification.requestPermission().catch(() => {
      // Ignore permission prompt errors.
    });
  }, []);

  useEffect(() => {
    const token = getLguToken();
    if (!token) return;

    let lastRefreshAt = 0;
    const socket = createNotificationsSocket(token);

    const onRefresh = (payload: NotificationsRefreshPayload) => {
      const now = Date.now();
      if (now - lastRefreshAt < 1500) return;
      lastRefreshAt = now;
      maybeShowBrowserNotification(payload);
      void refresh();
    };

    socket.on("notifications:refresh", onRefresh);
    socket.connect();

    return () => {
      socket.off("notifications:refresh", onRefresh);
      socket.disconnect();
    };
  }, [refresh]);

  const typeOptions = useMemo(() => notificationTypeOptions(), []);

  const tabOptions = useMemo(
    () => {
      const scopedItems = items.filter((notification) =>
        filters.scope === "ARCHIVED" ? notification.archived : !notification.archived
      );
      return tabOptionsBase.map((tab) => ({
        ...tab,
        count: scopedItems.filter((notification) => matchesNotificationTab(tab.value, notification)).length,
      }));
    },
    [items, filters.scope]
  );

  const filtered = useMemo(() => {
    const typeFilter = filters.type;
    const scope = filters.scope;
    const tab = filters.tab;
    const query = filters.query.trim().toLowerCase();
    const sort = filters.sort;

    return items
      .filter((n) => {
        if (scope === "ARCHIVED") {
          if (!n.archived) return false;
        } else {
          if (n.archived) return false;
          if (scope === "UNREAD" && n.read) return false;
          if (scope === "READ" && !n.read) return false;
        }

        if (!matchesNotificationTab(tab, n)) return false;
        if (!matchesNotificationType(typeFilter as NotificationType | "ALL", n.type)) return false;
        if (query && !notificationSearchText(n).includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = notificationTimestamp(a);
        const bTime = notificationTimestamp(b);
        return sort === "NEWEST" ? bTime - aTime : aTime - bTime;
      });
  }, [items, filters]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read && !n.archived).length, [items]);

  const openDetails = useCallback((n: LguNotification) => {
    setSelected(n);
    setDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelected(null);
  }, []);

  const markRead = useCallback((id: string) => {
    markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setSelected((prev) => (prev?.id === id ? { ...prev, read: true } : prev));
  }, []);

  const markAllRead = useCallback(() => {
    const ids = filtered.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    markNotificationsRead(ids);
    setItems((prev) => prev.map((n) => (idsSet.has(n.id) ? { ...n, read: true } : n)));
    setSelected((prev) => (prev && idsSet.has(prev.id) ? { ...prev, read: true } : prev));
  }, [filtered]);

  const archiveOne = useCallback(
    (id: string) => {
      archiveNotification(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, archived: true } : n)));
      setSelected((prev) => (prev?.id === id ? { ...prev, archived: true } : prev));
    },
    []
  );

  const unarchiveOne = useCallback(
    (id: string) => {
      unarchiveNotification(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, archived: false } : n)));
      setSelected((prev) => (prev?.id === id ? { ...prev, archived: false } : prev));
    },
    []
  );

  const archiveAll = useCallback(() => {
    const ids = filtered.filter((n) => !n.archived).map((n) => n.id);
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    archiveNotifications(ids);
    setItems((prev) => prev.map((n) => (idsSet.has(n.id) ? { ...n, archived: true } : n)));
    setSelected((prev) => (prev && idsSet.has(prev.id) ? { ...prev, archived: true } : prev));
  }, [filtered]);

  const unarchiveAll = useCallback(() => {
    const ids = filtered.filter((n) => n.archived).map((n) => n.id);
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    unarchiveNotifications(ids);
    setItems((prev) => prev.map((n) => (idsSet.has(n.id) ? { ...n, archived: false } : n)));
    setSelected((prev) => (prev && idsSet.has(prev.id) ? { ...prev, archived: false } : prev));
  }, [filtered]);

  const setTab = useCallback((tab: NotificationTab) => {
    setFilters((prev) => ({ ...prev, tab }));
  }, []);

  const setScope = useCallback((scope: NotificationsFilters["scope"]) => {
    setFilters((prev) => ({ ...prev, scope }));
  }, []);

  const setType = useCallback((type: NotificationsFilters["type"]) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  const setSort = useCallback((sort: NotificationsFilters["sort"]) => {
    setFilters((prev) => ({ ...prev, sort }));
  }, []);

  return {
    items,
    filtered,
    filters,
    setFilters,
    setTab,
    setScope,
    setType,
    setQuery,
    setSort,
    typeOptions,
    tabOptions,
    unreadCount,
    loading,
    error,
    refresh,
    selected,
    detailsOpen,
    openDetails,
    closeDetails,
    markRead,
    markAllRead,
    archiveOne,
    unarchiveOne,
    archiveAll,
    unarchiveAll,
  };
}
