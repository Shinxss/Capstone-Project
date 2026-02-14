import { useCallback, useEffect, useMemo, useState } from "react";
import type { LguNotification, NotificationsFilters, NotificationType } from "../models/notifications.types";
import {
  fetchLguNotifications,
  markNotificationRead,
  markNotificationsRead,
  matchesNotificationType,
  notificationTypeOptions,
} from "../services/notifications.service";

const defaultFilters: NotificationsFilters = { scope: "ALL", type: "ALL" };

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

  const typeOptions = useMemo(() => notificationTypeOptions(), []);

  const filtered = useMemo(() => {
    const typeFilter = filters.type;
    const scope = filters.scope;
    return items.filter((n) => {
      if (scope === "UNREAD" && n.read) return false;
      if (!matchesNotificationType(typeFilter as NotificationType | "ALL", n.type)) return false;
      return true;
    });
  }, [items, filters]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

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
  }, []);

  const markAllRead = useCallback(() => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    markNotificationsRead(ids);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [items]);

  return {
    items,
    filtered,
    filters,
    setFilters,
    typeOptions,
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
  };
}

