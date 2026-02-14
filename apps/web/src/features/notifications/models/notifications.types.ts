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
  source?: { kind: "dispatch" | "emergency" | "announcement" | "system"; id: string } | null;
};

export type NotificationsFilters = {
  scope: "ALL" | "UNREAD";
  type: "ALL" | NotificationType;
};

