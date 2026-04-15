import { useCallback, useEffect, useState } from "react";
import type { LguNotification } from "../models/notifications.types";
import {
  archiveNotification,
  archiveNotifications,
  fetchLguNotifications,
  markNotificationRead,
  markNotificationsRead,
  unarchiveNotification,
  unarchiveNotifications,
} from "../services/notifications.service";

function resolveErrorMessage(error: unknown) {
  const fallback = "Failed to load notifications";
  if (!error || typeof error !== "object") return fallback;

  const maybeError = error as {
    message?: unknown;
    response?: {
      data?: {
        message?: unknown;
      };
    };
  };

  const responseMessage = maybeError.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim()) {
    return maybeError.message;
  }

  return fallback;
}

export function useLguNotificationsData() {
  const [items, setItems] = useState<LguNotification[]>([]);
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
    } catch (error: unknown) {
      setError(resolveErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDetails = useCallback((notification: LguNotification) => {
    setSelected(notification);
    setDetailsOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelected(null);
  }, []);

  const markRead = useCallback((id: string) => {
    markNotificationRead(id);
    setItems((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    setSelected((prev) => (prev?.id === id ? { ...prev, read: true } : prev));
  }, []);

  const markAllRead = useCallback((sourceItems: LguNotification[]) => {
    const ids = sourceItems.filter((notification) => !notification.read).map((notification) => notification.id);
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    markNotificationsRead(ids);
    setItems((prev) => prev.map((notification) => (idsSet.has(notification.id) ? { ...notification, read: true } : notification)));
    setSelected((prev) => (prev && idsSet.has(prev.id) ? { ...prev, read: true } : prev));
  }, []);

  const archiveOne = useCallback((id: string) => {
    archiveNotification(id);
    setItems((prev) => prev.map((notification) => (notification.id === id ? { ...notification, archived: true } : notification)));
    setSelected((prev) => (prev?.id === id ? { ...prev, archived: true } : prev));
  }, []);

  const unarchiveOne = useCallback((id: string) => {
    unarchiveNotification(id);
    setItems((prev) => prev.map((notification) => (notification.id === id ? { ...notification, archived: false } : notification)));
    setSelected((prev) => (prev?.id === id ? { ...prev, archived: false } : prev));
  }, []);

  const archiveAll = useCallback((sourceItems: LguNotification[]) => {
    const ids = sourceItems.filter((notification) => !notification.archived).map((notification) => notification.id);
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    archiveNotifications(ids);
    setItems((prev) => prev.map((notification) => (idsSet.has(notification.id) ? { ...notification, archived: true } : notification)));
    setSelected((prev) => (prev && idsSet.has(prev.id) ? { ...prev, archived: true } : prev));
  }, []);

  const unarchiveAll = useCallback((sourceItems: LguNotification[]) => {
    const ids = sourceItems.filter((notification) => notification.archived).map((notification) => notification.id);
    if (ids.length === 0) return;

    const idsSet = new Set(ids);
    unarchiveNotifications(ids);
    setItems((prev) => prev.map((notification) => (idsSet.has(notification.id) ? { ...notification, archived: false } : notification)));
    setSelected((prev) => (prev && idsSet.has(prev.id) ? { ...prev, archived: false } : prev));
  }, []);

  return {
    items,
    loading,
    error,
    selected,
    detailsOpen,
    refresh,
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
