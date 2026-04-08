export type NotificationRole =
  | "community_member"
  | "volunteer"
  | "responder"
  | "barangay_official"
  | "cdrmo_admin"
  | "super_admin"
  | "unknown";

export type NotificationCategory =
  | "UPDATE"
  | "ALERT"
  | "TASK"
  | "ANNOUNCEMENT"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type NotificationStatus = "READ" | "UNREAD";

export type NotificationFilter =
  | "ALL"
  | "UNREAD"
  | "ALERTS"
  | "TASKS"
  | "ANNOUNCEMENTS";

export type NotificationEntityType =
  | "REQUEST"
  | "EMERGENCY"
  | "TASK"
  | "ANNOUNCEMENT"
  | "HAZARD_ZONE"
  | "WEATHER"
  | "USER_ACCOUNT"
  | "SYSTEM";

export type NotificationType =
  | "HELP_REQUEST_ACKNOWLEDGED"
  | "EMERGENCY_VERIFIED"
  | "RESPONDER_DISPATCHED"
  | "RESPONDER_EN_ROUTE"
  | "RESPONDER_ARRIVED"
  | "EMERGENCY_RESOLVED"
  | "VOLUNTEER_ACCOUNT_VERIFIED"
  | "NEW_TASK_ASSIGNED"
  | "TASK_ACCEPTED"
  | "TASK_CANCELLED_OR_REASSIGNED"
  | "WEATHER_ADVISORY"
  | "HAZARD_ZONE_WARNING"
  | "LGU_ANNOUNCEMENT"
  | "AFTER_ACTION_REPORT_APPROVED"
  | "AFTER_ACTION_REPORT_REJECTED"
  | "RESPONDER_ACCOUNT_ACTIVATED"
  | "ROUTE_UPDATED"
  | "NEW_EMERGENCY_REPORT_RECEIVED"
  | "TASK_PROGRESS_UPDATE"
  | "AFTER_ACTION_REPORT_SUBMITTED"
  | "MAJOR_EMERGENCY_REPORT"
  | "ESCALATED_INCIDENT"
  | "SYSTEM_DISPATCH_UPDATE"
  | "VERIFICATION_APPROVAL_EVENT"
  | "SEVERE_WEATHER_SUMMARY"
  | "HIGH_PRIORITY_ANNOUNCEMENT"
  | "SYSTEM";

export type NotificationEntityLink = {
  relatedEntityType?: NotificationEntityType;
  relatedEntityId?: string;
  routeName?: string;
  routeParams?: Record<string, string>;
};

export type MobileNotificationItem = NotificationEntityLink & {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
  status: NotificationStatus;
  priority: NotificationPriority;
  recipientRole: NotificationRole;
  actorName?: string;
  metadata?: Record<string, string>;
  iconKey?: string;
};

export type MobileNotificationInsert = NotificationEntityLink & {
  id: string;
  type: NotificationType | string;
  category?: NotificationCategory;
  title: string;
  body: string;
  createdAt?: string;
  readAt?: string | null;
  isRead?: boolean;
  priority?: NotificationPriority;
  recipientRole?: NotificationRole;
  actorName?: string;
  metadata?: Record<string, string>;
  iconKey?: string;
  // Legacy aliases (kept for backward compatibility)
  read?: boolean;
  targetPath?: string;
  targetParams?: Record<string, string>;
};

export type MobileNotificationMeta = {
  knownHazardZoneIds: string[];
  seenAnnouncementIds: string[];
  lastWeatherSignature: string | null;
  volunteerStatusByUserId: Record<string, string>;
  hazardsPrimed: boolean;
  announcementsPrimed: boolean;
};

export type PaginatedNotificationResponse = {
  items: MobileNotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
};
