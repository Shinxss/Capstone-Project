import { useCallback, useMemo, useState } from "react";
import type {
  LguNotification,
  NotificationsFilters,
  NotificationTab,
  NotificationType,
} from "../models/notifications.types";
import {
  matchesNotificationType,
  notificationTypeOptions,
} from "../services/notifications.service";

export const defaultFilters: NotificationsFilters = {
  scope: "ALL",
  type: "ALL",
  tab: "ALL",
  query: "",
  sort: "NEWEST",
};

export const tabOptionsBase: Array<{ value: NotificationTab; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "SOS", label: "SOS" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "SYSTEM", label: "System" },
];

export function isSosNotification(notification: LguNotification) {
  const sourceId = String(notification.source?.id || "").toLowerCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (notification.type !== "emergency") return false;
  return sourceId.includes("sos") || text.includes("sos");
}

export function matchesNotificationTab(tab: NotificationTab, notification: LguNotification) {
  if (tab === "ALL") return true;
  if (tab === "SOS") return isSosNotification(notification);
  if (tab === "EMERGENCY") return notification.type === "emergency";
  if (tab === "VOLUNTEER") return notification.type === "task" || notification.type === "verification";
  if (tab === "SYSTEM") return notification.type === "system" || notification.type === "announcement";
  return true;
}

export function notificationSearchText(notification: LguNotification) {
  return `${notification.title} ${notification.message} ${notification.source?.id || ""}`.toLowerCase();
}

export function notificationTimestamp(notification: LguNotification) {
  const time = new Date(notification.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function useLguNotificationsFilters(items: LguNotification[]) {
  const [filters, setFilters] = useState<NotificationsFilters>(defaultFilters);

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
      .filter((notification) => {
        if (scope === "ARCHIVED") {
          if (!notification.archived) return false;
        } else {
          if (notification.archived) return false;
          if (scope === "UNREAD" && notification.read) return false;
          if (scope === "READ" && !notification.read) return false;
        }

        if (!matchesNotificationTab(tab, notification)) return false;
        if (!matchesNotificationType(typeFilter as NotificationType | "ALL", notification.type)) return false;
        if (query && !notificationSearchText(notification).includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = notificationTimestamp(a);
        const bTime = notificationTimestamp(b);
        return sort === "NEWEST" ? bTime - aTime : aTime - bTime;
      });
  }, [items, filters]);

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read && !notification.archived).length,
    [items]
  );

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
    filters,
    setFilters,
    setTab,
    setScope,
    setType,
    setQuery,
    setSort,
    typeOptions,
    tabOptions,
    filtered,
    unreadCount,
  };
}
