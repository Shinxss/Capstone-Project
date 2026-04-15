import { useCallback, useMemo, useState } from "react";
import { useMobileNotifications } from "./useMobileNotifications";
import type {
  MobileNotificationItem,
  NotificationFilter,
} from "../models/mobileNotification";
import {
  buildSections,
  formatItemTime,
  iconForItem,
} from "../utils/notificationPresentation";

export function useNotificationsScreenModel() {
  const notifications = useMobileNotifications();
  const [actionsVisible, setActionsVisible] = useState(false);

  const searchValue = notifications.query;
  const setSearchValue = notifications.setQuery;

  const filterTab = notifications.filter;
  const setFilterTab = notifications.setFilter;

  const filtered = notifications.filteredItems;
  const sections = useMemo(() => buildSections(filtered), [filtered]);

  const emptyState = notifications.emptyState;
  const unreadCount = notifications.unreadCount;

  const markRead = useCallback((id: string) => notifications.markRead(id), [notifications.markRead]);
  const markAllRead = useCallback(() => notifications.markAllRead(), [notifications.markAllRead]);

  const titleForItem = useCallback(
    (item: MobileNotificationItem) => notifications.titleForItem(item),
    [notifications.titleForItem]
  );

  const canNavigate = useCallback(
    (item: MobileNotificationItem) => notifications.canNavigate(item),
    [notifications.canNavigate]
  );

  const openNotification = useCallback(
    (item: MobileNotificationItem) => notifications.openNotification(item),
    [notifications.openNotification]
  );

  const deleteOne = useCallback((id: string) => notifications.deleteOne(id), [notifications.deleteOne]);
  const deleteMany = useCallback(
    (ids: string[]) => notifications.deleteMany(ids),
    [notifications.deleteMany]
  );

  const setFilter = useCallback(
    (filter: NotificationFilter) => setFilterTab(filter),
    [setFilterTab]
  );

  return {
    searchValue,
    setSearchValue,
    filterTab,
    setFilterTab: setFilter,
    actionsVisible,
    setActionsVisible,
    filtered,
    sections,
    emptyState,
    unreadCount,
    markRead,
    markAllRead,
    loading: notifications.loading,
    refreshing: notifications.refreshing,
    error: notifications.error,
    onRefresh: notifications.onRefresh,
    retry: notifications.retry,
    items: notifications.items,
    unreadByFilter: notifications.unreadByFilter,
    openNotification,
    canNavigate,
    titleForItem,
    formatItemTime,
    iconForItem,
    deleteOne,
    deleteMany,
  };
}
