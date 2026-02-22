export type NotificationType =
  | "task"
  | "emergency"
  | "verification"
  | "announcement"
  | "system";

export type LguNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO
  read: boolean;
  archived: boolean;
  source?: { kind: "dispatch" | "emergency" | "announcement" | "system"; id: string } | null;
};

export type NotificationScope = "ALL" | "UNREAD" | "READ" | "ARCHIVED";
export type NotificationTab = "ALL" | "SOS" | "EMERGENCY" | "VOLUNTEER" | "SYSTEM";
export type NotificationSort = "NEWEST" | "OLDEST";

export type NotificationsFilters = {
  scope: NotificationScope;
  type: "ALL" | NotificationType;
  tab: NotificationTab;
  query: string;
  sort: NotificationSort;
};
