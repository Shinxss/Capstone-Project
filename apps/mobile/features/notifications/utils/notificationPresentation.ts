import { NOTIFICATION_TYPE_ICON } from "../constants/notification.constants";
import type { MobileNotificationItem } from "../models/mobileNotification";

type NotificationSectionLabel = "Today" | "Yesterday" | "Older";

export type NotificationSection = {
  key: string;
  label: NotificationSectionLabel;
  items: MobileNotificationItem[];
};

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function sectionLabel(createdAt: string, now: Date): NotificationSectionLabel {
  const targetDate = new Date(createdAt);
  if (!Number.isFinite(targetDate.getTime())) return "Older";

  const nowDay = startOfDay(now);
  const targetDay = startOfDay(targetDate);
  const dayDiff = Math.floor((nowDay - targetDay) / (24 * 60 * 60 * 1000));

  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return "Older";
}

export function buildSections(items: MobileNotificationItem[]): NotificationSection[] {
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

export function formatItemTime(createdAt: string) {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return "";

  const now = new Date();
  if (startOfDay(date) === startOfDay(now)) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function iconForItem(item: MobileNotificationItem) {
  const iconKey = item.iconKey?.trim();
  if (iconKey) return iconKey;
  return NOTIFICATION_TYPE_ICON[item.type] ?? "notifications-outline";
}
