import { useCallback } from "react";
import { useLguNotificationsData } from "./useLguNotificationsData";
import { useLguNotificationsFilters } from "./useLguNotificationsFilters";
import { useNotificationsSocketRefresh } from "./useNotificationsSocketRefresh";

export function useLguNotifications() {
  const data = useLguNotificationsData();
  const filters = useLguNotificationsFilters(data.items);

  useNotificationsSocketRefresh(data.refresh);

  const markAllRead = useCallback(() => {
    data.markAllRead(filters.filtered);
  }, [data, filters.filtered]);

  const archiveAll = useCallback(() => {
    data.archiveAll(filters.filtered);
  }, [data, filters.filtered]);

  const unarchiveAll = useCallback(() => {
    data.unarchiveAll(filters.filtered);
  }, [data, filters.filtered]);

  return {
    items: data.items,
    filtered: filters.filtered,
    filters: filters.filters,
    setFilters: filters.setFilters,
    setTab: filters.setTab,
    setScope: filters.setScope,
    setType: filters.setType,
    setQuery: filters.setQuery,
    setSort: filters.setSort,
    typeOptions: filters.typeOptions,
    tabOptions: filters.tabOptions,
    unreadCount: filters.unreadCount,
    loading: data.loading,
    error: data.error,
    refresh: data.refresh,
    selected: data.selected,
    detailsOpen: data.detailsOpen,
    openDetails: data.openDetails,
    closeDetails: data.closeDetails,
    markRead: data.markRead,
    markAllRead,
    archiveOne: data.archiveOne,
    unarchiveOne: data.unarchiveOne,
    archiveAll,
    unarchiveAll,
  };
}
