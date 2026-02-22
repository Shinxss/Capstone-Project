import { useCallback, useEffect, useState } from "react";
import { getLguToken } from "../../auth/services/authStorage";
import {
  createNotificationsSocket,
  type NotificationsRefreshPayload,
} from "../services/notifications.socket";
import {
  fetchLguNotifications,
  NOTIFICATIONS_LOCAL_STATE_EVENT,
} from "../services/notifications.service";

function countUnread(ids: Array<{ read: boolean; archived: boolean }>) {
  return ids.reduce((total, item) => total + (!item.read && !item.archived ? 1 : 0), 0);
}

export function useLguNotificationsUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const notifications = await fetchLguNotifications();
      setUnreadCount(countUnread(notifications));
    } catch {
      // Silent fail: badge is non-critical UI metadata.
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    const onLocalStateChanged = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(NOTIFICATIONS_LOCAL_STATE_EVENT, onLocalStateChanged);
    return () => {
      window.removeEventListener(NOTIFICATIONS_LOCAL_STATE_EVENT, onLocalStateChanged);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    const token = getLguToken();
    if (!token) return;

    let lastRefreshAt = 0;
    const socket = createNotificationsSocket(token);

    const onRefresh = (_payload: NotificationsRefreshPayload) => {
      const now = Date.now();
      if (now - lastRefreshAt < 1500) return;
      lastRefreshAt = now;
      void refreshUnreadCount();
    };

    socket.on("notifications:refresh", onRefresh);
    socket.connect();

    return () => {
      socket.off("notifications:refresh", onRefresh);
      socket.disconnect();
    };
  }, [refreshUnreadCount]);

  return unreadCount;
}
