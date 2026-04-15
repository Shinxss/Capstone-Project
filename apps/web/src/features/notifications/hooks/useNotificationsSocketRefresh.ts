import { useEffect } from "react";
import { getLguUser } from "../../auth/services/authStorage";
import {
  createNotificationsSocket,
  type NotificationsRefreshPayload,
} from "../services/notifications.socket";

export function supportsBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationBodyFromReason(reason: string) {
  const normalized = String(reason || "").trim().toLowerCase();
  if (normalized === "emergency_reported") return "A new emergency report needs attention.";
  if (normalized === "dispatch_accepted") return "A dispatch has been accepted.";
  if (normalized === "dispatch_completed") return "A dispatch has been completed and may need verification.";
  if (normalized === "dispatch_verified") return "A dispatch has been verified.";
  return "There is a new notification update.";
}

export function maybeShowBrowserNotification(payload: NotificationsRefreshPayload) {
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

export function useNotificationsSocketRefresh(refresh: () => void | Promise<void>) {
  useEffect(() => {
    if (!supportsBrowserNotifications()) return;
    if (Notification.permission !== "default") return;
    void Notification.requestPermission().catch(() => {
      // Ignore permission prompt errors.
    });
  }, []);

  useEffect(() => {
    const user = getLguUser();
    if (!user?.id) return;

    let lastRefreshAt = 0;
    const socket = createNotificationsSocket();

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
}
