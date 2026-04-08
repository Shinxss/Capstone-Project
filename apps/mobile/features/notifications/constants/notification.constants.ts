import type {
  MobileNotificationItem,
  NotificationCategory,
  NotificationFilter,
  NotificationPriority,
  NotificationRole,
  NotificationType,
} from "../models/mobileNotification";

export const CORE_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "HELP_REQUEST_ACKNOWLEDGED",
  "EMERGENCY_VERIFIED",
  "RESPONDER_DISPATCHED",
  "RESPONDER_EN_ROUTE",
  "RESPONDER_ARRIVED",
  "EMERGENCY_RESOLVED",
  "VOLUNTEER_ACCOUNT_VERIFIED",
  "NEW_TASK_ASSIGNED",
  "TASK_ACCEPTED",
  "TASK_CANCELLED_OR_REASSIGNED",
  "WEATHER_ADVISORY",
  "HAZARD_ZONE_WARNING",
] as const;

export const NOTIFICATION_FILTER_ITEMS: ReadonlyArray<{
  key: NotificationFilter;
  label: string;
}> = [
  { key: "ALL", label: "All" },
  { key: "UNREAD", label: "Unread" },
  { key: "ALERTS", label: "Alerts" },
  { key: "TASKS", label: "Tasks" },
  { key: "ANNOUNCEMENTS", label: "Announcements" },
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  HELP_REQUEST_ACKNOWLEDGED: "Help request acknowledged",
  EMERGENCY_VERIFIED: "Emergency verified",
  RESPONDER_DISPATCHED: "Responder dispatched",
  RESPONDER_EN_ROUTE: "Responder en route",
  RESPONDER_ARRIVED: "Responder arrived",
  EMERGENCY_RESOLVED: "Emergency resolved",
  VOLUNTEER_ACCOUNT_VERIFIED: "Volunteer account verified",
  NEW_TASK_ASSIGNED: "New task assigned",
  TASK_ACCEPTED: "Task accepted",
  TASK_CANCELLED_OR_REASSIGNED: "Task cancelled or reassigned",
  WEATHER_ADVISORY: "Weather advisory",
  HAZARD_ZONE_WARNING: "Hazard-zone warning",
  LGU_ANNOUNCEMENT: "LGU announcement",
  AFTER_ACTION_REPORT_APPROVED: "After-action report approved",
  AFTER_ACTION_REPORT_REJECTED: "After-action report rejected",
  RESPONDER_ACCOUNT_ACTIVATED: "Responder account activated",
  ROUTE_UPDATED: "Route updated",
  NEW_EMERGENCY_REPORT_RECEIVED: "New emergency report received",
  TASK_PROGRESS_UPDATE: "Task progress update",
  AFTER_ACTION_REPORT_SUBMITTED: "After-action report submitted",
  MAJOR_EMERGENCY_REPORT: "Major emergency report",
  ESCALATED_INCIDENT: "Escalated incident",
  SYSTEM_DISPATCH_UPDATE: "System dispatch update",
  VERIFICATION_APPROVAL_EVENT: "Verification or approval event",
  SEVERE_WEATHER_SUMMARY: "Severe weather summary",
  HIGH_PRIORITY_ANNOUNCEMENT: "High-priority announcement",
  SYSTEM: "System update",
};

export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  HELP_REQUEST_ACKNOWLEDGED: "UPDATE",
  EMERGENCY_VERIFIED: "UPDATE",
  RESPONDER_DISPATCHED: "UPDATE",
  RESPONDER_EN_ROUTE: "UPDATE",
  RESPONDER_ARRIVED: "UPDATE",
  EMERGENCY_RESOLVED: "UPDATE",
  VOLUNTEER_ACCOUNT_VERIFIED: "TASK",
  NEW_TASK_ASSIGNED: "TASK",
  TASK_ACCEPTED: "TASK",
  TASK_CANCELLED_OR_REASSIGNED: "TASK",
  WEATHER_ADVISORY: "ALERT",
  HAZARD_ZONE_WARNING: "ALERT",
  LGU_ANNOUNCEMENT: "ANNOUNCEMENT",
  AFTER_ACTION_REPORT_APPROVED: "TASK",
  AFTER_ACTION_REPORT_REJECTED: "TASK",
  RESPONDER_ACCOUNT_ACTIVATED: "TASK",
  ROUTE_UPDATED: "TASK",
  NEW_EMERGENCY_REPORT_RECEIVED: "UPDATE",
  TASK_PROGRESS_UPDATE: "TASK",
  AFTER_ACTION_REPORT_SUBMITTED: "TASK",
  MAJOR_EMERGENCY_REPORT: "UPDATE",
  ESCALATED_INCIDENT: "UPDATE",
  SYSTEM_DISPATCH_UPDATE: "UPDATE",
  VERIFICATION_APPROVAL_EVENT: "UPDATE",
  SEVERE_WEATHER_SUMMARY: "ALERT",
  HIGH_PRIORITY_ANNOUNCEMENT: "ANNOUNCEMENT",
  SYSTEM: "SYSTEM",
};

export const NOTIFICATION_TYPE_PRIORITY: Record<NotificationType, NotificationPriority> = {
  HELP_REQUEST_ACKNOWLEDGED: "NORMAL",
  EMERGENCY_VERIFIED: "NORMAL",
  RESPONDER_DISPATCHED: "HIGH",
  RESPONDER_EN_ROUTE: "HIGH",
  RESPONDER_ARRIVED: "HIGH",
  EMERGENCY_RESOLVED: "NORMAL",
  VOLUNTEER_ACCOUNT_VERIFIED: "NORMAL",
  NEW_TASK_ASSIGNED: "HIGH",
  TASK_ACCEPTED: "NORMAL",
  TASK_CANCELLED_OR_REASSIGNED: "HIGH",
  WEATHER_ADVISORY: "HIGH",
  HAZARD_ZONE_WARNING: "CRITICAL",
  LGU_ANNOUNCEMENT: "NORMAL",
  AFTER_ACTION_REPORT_APPROVED: "NORMAL",
  AFTER_ACTION_REPORT_REJECTED: "NORMAL",
  RESPONDER_ACCOUNT_ACTIVATED: "NORMAL",
  ROUTE_UPDATED: "HIGH",
  NEW_EMERGENCY_REPORT_RECEIVED: "HIGH",
  TASK_PROGRESS_UPDATE: "NORMAL",
  AFTER_ACTION_REPORT_SUBMITTED: "NORMAL",
  MAJOR_EMERGENCY_REPORT: "CRITICAL",
  ESCALATED_INCIDENT: "CRITICAL",
  SYSTEM_DISPATCH_UPDATE: "HIGH",
  VERIFICATION_APPROVAL_EVENT: "NORMAL",
  SEVERE_WEATHER_SUMMARY: "HIGH",
  HIGH_PRIORITY_ANNOUNCEMENT: "HIGH",
  SYSTEM: "LOW",
};

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, string> = {
  HELP_REQUEST_ACKNOWLEDGED: "checkmark-circle-outline",
  EMERGENCY_VERIFIED: "shield-checkmark-outline",
  RESPONDER_DISPATCHED: "car-outline",
  RESPONDER_EN_ROUTE: "navigate-outline",
  RESPONDER_ARRIVED: "location-outline",
  EMERGENCY_RESOLVED: "checkmark-done-outline",
  VOLUNTEER_ACCOUNT_VERIFIED: "person-circle-outline",
  NEW_TASK_ASSIGNED: "clipboard-outline",
  TASK_ACCEPTED: "thumbs-up-outline",
  TASK_CANCELLED_OR_REASSIGNED: "swap-horizontal-outline",
  WEATHER_ADVISORY: "rainy-outline",
  HAZARD_ZONE_WARNING: "warning-outline",
  LGU_ANNOUNCEMENT: "megaphone-outline",
  AFTER_ACTION_REPORT_APPROVED: "document-text-outline",
  AFTER_ACTION_REPORT_REJECTED: "document-text-outline",
  RESPONDER_ACCOUNT_ACTIVATED: "person-add-outline",
  ROUTE_UPDATED: "trail-sign-outline",
  NEW_EMERGENCY_REPORT_RECEIVED: "alert-circle-outline",
  TASK_PROGRESS_UPDATE: "pulse-outline",
  AFTER_ACTION_REPORT_SUBMITTED: "file-tray-full-outline",
  MAJOR_EMERGENCY_REPORT: "warning-outline",
  ESCALATED_INCIDENT: "alert-outline",
  SYSTEM_DISPATCH_UPDATE: "car-sport-outline",
  VERIFICATION_APPROVAL_EVENT: "shield-outline",
  SEVERE_WEATHER_SUMMARY: "thunderstorm-outline",
  HIGH_PRIORITY_ANNOUNCEMENT: "notifications-outline",
  SYSTEM: "notifications-outline",
};

export const NOTIFICATION_TYPE_ICON_ACCENT: Record<
  NotificationType,
  { light: string; dark: string; bgLight: string; bgDark: string }
> = {
  HELP_REQUEST_ACKNOWLEDGED: { light: "#2563EB", dark: "#93C5FD", bgLight: "#DBEAFE", bgDark: "#1E3A8A" },
  EMERGENCY_VERIFIED: { light: "#16A34A", dark: "#86EFAC", bgLight: "#DCFCE7", bgDark: "#14532D" },
  RESPONDER_DISPATCHED: { light: "#B45309", dark: "#FCD34D", bgLight: "#FEF3C7", bgDark: "#78350F" },
  RESPONDER_EN_ROUTE: { light: "#D97706", dark: "#FBBF24", bgLight: "#FFEDD5", bgDark: "#7C2D12" },
  RESPONDER_ARRIVED: { light: "#0EA5E9", dark: "#7DD3FC", bgLight: "#E0F2FE", bgDark: "#0C4A6E" },
  EMERGENCY_RESOLVED: { light: "#15803D", dark: "#86EFAC", bgLight: "#DCFCE7", bgDark: "#14532D" },
  VOLUNTEER_ACCOUNT_VERIFIED: { light: "#0891B2", dark: "#67E8F9", bgLight: "#CFFAFE", bgDark: "#164E63" },
  NEW_TASK_ASSIGNED: { light: "#1D4ED8", dark: "#93C5FD", bgLight: "#DBEAFE", bgDark: "#1E3A8A" },
  TASK_ACCEPTED: { light: "#059669", dark: "#6EE7B7", bgLight: "#D1FAE5", bgDark: "#064E3B" },
  TASK_CANCELLED_OR_REASSIGNED: { light: "#DC2626", dark: "#FCA5A5", bgLight: "#FEE2E2", bgDark: "#7F1D1D" },
  WEATHER_ADVISORY: { light: "#0EA5E9", dark: "#7DD3FC", bgLight: "#E0F2FE", bgDark: "#0C4A6E" },
  HAZARD_ZONE_WARNING: { light: "#DC2626", dark: "#FCA5A5", bgLight: "#FEE2E2", bgDark: "#7F1D1D" },
  LGU_ANNOUNCEMENT: { light: "#B45309", dark: "#FCD34D", bgLight: "#FEF3C7", bgDark: "#78350F" },
  AFTER_ACTION_REPORT_APPROVED: { light: "#16A34A", dark: "#86EFAC", bgLight: "#DCFCE7", bgDark: "#14532D" },
  AFTER_ACTION_REPORT_REJECTED: { light: "#DC2626", dark: "#FCA5A5", bgLight: "#FEE2E2", bgDark: "#7F1D1D" },
  RESPONDER_ACCOUNT_ACTIVATED: { light: "#1D4ED8", dark: "#93C5FD", bgLight: "#DBEAFE", bgDark: "#1E3A8A" },
  ROUTE_UPDATED: { light: "#7C3AED", dark: "#C4B5FD", bgLight: "#EDE9FE", bgDark: "#4C1D95" },
  NEW_EMERGENCY_REPORT_RECEIVED: { light: "#DC2626", dark: "#FCA5A5", bgLight: "#FEE2E2", bgDark: "#7F1D1D" },
  TASK_PROGRESS_UPDATE: { light: "#0EA5E9", dark: "#7DD3FC", bgLight: "#E0F2FE", bgDark: "#0C4A6E" },
  AFTER_ACTION_REPORT_SUBMITTED: { light: "#1D4ED8", dark: "#93C5FD", bgLight: "#DBEAFE", bgDark: "#1E3A8A" },
  MAJOR_EMERGENCY_REPORT: { light: "#DC2626", dark: "#FCA5A5", bgLight: "#FEE2E2", bgDark: "#7F1D1D" },
  ESCALATED_INCIDENT: { light: "#B91C1C", dark: "#FCA5A5", bgLight: "#FEE2E2", bgDark: "#7F1D1D" },
  SYSTEM_DISPATCH_UPDATE: { light: "#B45309", dark: "#FCD34D", bgLight: "#FEF3C7", bgDark: "#78350F" },
  VERIFICATION_APPROVAL_EVENT: { light: "#2563EB", dark: "#93C5FD", bgLight: "#DBEAFE", bgDark: "#1E3A8A" },
  SEVERE_WEATHER_SUMMARY: { light: "#0284C7", dark: "#7DD3FC", bgLight: "#E0F2FE", bgDark: "#0C4A6E" },
  HIGH_PRIORITY_ANNOUNCEMENT: { light: "#C2410C", dark: "#FDBA74", bgLight: "#FFEDD5", bgDark: "#7C2D12" },
  SYSTEM: { light: "#4B5563", dark: "#CBD5E1", bgLight: "#E5E7EB", bgDark: "#1F2937" },
};

export const NOTIFICATION_DEFAULT_ROUTE: Partial<Record<NotificationType, string>> = {
  HELP_REQUEST_ACKNOWLEDGED: "/my-request-tracking",
  EMERGENCY_VERIFIED: "/my-request-tracking",
  RESPONDER_DISPATCHED: "/my-request-tracking",
  RESPONDER_EN_ROUTE: "/my-request-tracking",
  RESPONDER_ARRIVED: "/my-request-tracking",
  EMERGENCY_RESOLVED: "/my-request-tracking",
  NEW_TASK_ASSIGNED: "/(tabs)/tasks",
  TASK_ACCEPTED: "/(tabs)/tasks",
  TASK_CANCELLED_OR_REASSIGNED: "/(tabs)/tasks",
  VOLUNTEER_ACCOUNT_VERIFIED: "/(tabs)/tasks",
  WEATHER_ADVISORY: "/(tabs)/map",
  HAZARD_ZONE_WARNING: "/(tabs)/map",
};

export const ROLE_NOTIFICATION_TYPES: Record<NotificationRole, ReadonlySet<NotificationType>> = {
  community_member: new Set<NotificationType>([
    "HELP_REQUEST_ACKNOWLEDGED",
    "EMERGENCY_VERIFIED",
    "RESPONDER_DISPATCHED",
    "RESPONDER_EN_ROUTE",
    "RESPONDER_ARRIVED",
    "EMERGENCY_RESOLVED",
    "WEATHER_ADVISORY",
    "HAZARD_ZONE_WARNING",
    "LGU_ANNOUNCEMENT",
  ]),
  volunteer: new Set<NotificationType>([
    "VOLUNTEER_ACCOUNT_VERIFIED",
    "NEW_TASK_ASSIGNED",
    "TASK_ACCEPTED",
    "TASK_CANCELLED_OR_REASSIGNED",
    "AFTER_ACTION_REPORT_APPROVED",
    "AFTER_ACTION_REPORT_REJECTED",
    "WEATHER_ADVISORY",
    "HAZARD_ZONE_WARNING",
    "LGU_ANNOUNCEMENT",
  ]),
  responder: new Set<NotificationType>([
    "RESPONDER_ACCOUNT_ACTIVATED",
    "NEW_TASK_ASSIGNED",
    "ROUTE_UPDATED",
    "TASK_ACCEPTED",
    "TASK_CANCELLED_OR_REASSIGNED",
    "AFTER_ACTION_REPORT_APPROVED",
    "AFTER_ACTION_REPORT_REJECTED",
    "WEATHER_ADVISORY",
    "HAZARD_ZONE_WARNING",
    "LGU_ANNOUNCEMENT",
  ]),
  barangay_official: new Set<NotificationType>([
    "NEW_EMERGENCY_REPORT_RECEIVED",
    "EMERGENCY_VERIFIED",
    "TASK_ACCEPTED",
    "TASK_PROGRESS_UPDATE",
    "AFTER_ACTION_REPORT_SUBMITTED",
    "HAZARD_ZONE_WARNING",
    "WEATHER_ADVISORY",
    "LGU_ANNOUNCEMENT",
  ]),
  cdrmo_admin: new Set<NotificationType>([
    "MAJOR_EMERGENCY_REPORT",
    "ESCALATED_INCIDENT",
    "SYSTEM_DISPATCH_UPDATE",
    "VERIFICATION_APPROVAL_EVENT",
    "SEVERE_WEATHER_SUMMARY",
    "HIGH_PRIORITY_ANNOUNCEMENT",
    "WEATHER_ADVISORY",
    "HAZARD_ZONE_WARNING",
    "LGU_ANNOUNCEMENT",
  ]),
  super_admin: new Set<NotificationType>([
    "MAJOR_EMERGENCY_REPORT",
    "ESCALATED_INCIDENT",
    "SYSTEM_DISPATCH_UPDATE",
    "VERIFICATION_APPROVAL_EVENT",
    "SEVERE_WEATHER_SUMMARY",
    "HIGH_PRIORITY_ANNOUNCEMENT",
    "WEATHER_ADVISORY",
    "HAZARD_ZONE_WARNING",
    "LGU_ANNOUNCEMENT",
  ]),
  unknown: new Set<NotificationType>([
    "WEATHER_ADVISORY",
    "HAZARD_ZONE_WARNING",
    "LGU_ANNOUNCEMENT",
    "SYSTEM",
  ]),
};

const LEGACY_TYPE_MAP: Record<string, NotificationType> = {
  REQUEST_ACKNOWLEDGED: "HELP_REQUEST_ACKNOWLEDGED",
  REPORTED_EMERGENCY_VERIFIED: "EMERGENCY_VERIFIED",
  VOLUNTEER_VERIFIED: "VOLUNTEER_ACCOUNT_VERIFIED",
  DISPATCH_OFFER: "NEW_TASK_ASSIGNED",
  REQUEST_UPDATE: "HELP_REQUEST_ACKNOWLEDGED",
};

export function normalizeNotificationRole(rawRole: unknown): NotificationRole {
  const normalized = String(rawRole ?? "").trim().toUpperCase();
  if (!normalized) return "unknown";
  if (normalized === "COMMUNITY" || normalized === "COMMUNITY_MEMBER") return "community_member";
  if (normalized === "VOLUNTEER") return "volunteer";
  if (normalized === "RESPONDER") return "responder";
  if (normalized === "BARANGAY" || normalized === "BARANGAY_OFFICIAL" || normalized === "LGU") {
    return "barangay_official";
  }
  if (normalized === "CDRMO" || normalized === "CDRRMO" || normalized === "CDRMO_ADMIN") {
    return "cdrmo_admin";
  }
  if (normalized === "SUPER_ADMIN" || normalized === "ADMIN" || normalized === "SUPERADMIN") {
    return "super_admin";
  }
  return "unknown";
}

export function normalizeNotificationType(rawType: unknown): NotificationType {
  const normalized = String(rawType ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) return "SYSTEM";
  if (LEGACY_TYPE_MAP[normalized]) return LEGACY_TYPE_MAP[normalized];
  if (normalized in NOTIFICATION_TYPE_LABELS) return normalized as NotificationType;
  return "SYSTEM";
}

export function resolveNotificationCategory(type: NotificationType): NotificationCategory {
  return NOTIFICATION_TYPE_CATEGORY[type] ?? "SYSTEM";
}

export function resolveNotificationPriority(type: NotificationType): NotificationPriority {
  return NOTIFICATION_TYPE_PRIORITY[type] ?? "NORMAL";
}

export function roleSupportsNotificationType(role: NotificationRole, type: NotificationType) {
  const supported = ROLE_NOTIFICATION_TYPES[role];
  if (!supported) return true;
  if (supported.has(type)) return true;
  if (type === "SYSTEM") return true;
  return false;
}

function isoFromMinutesAgo(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

export function devMockNotificationsForRole(role: NotificationRole): MobileNotificationItem[] {
  const base: MobileNotificationItem[] = [
    {
      id: "mock-hazard-1",
      type: "HAZARD_ZONE_WARNING",
      category: "ALERT",
      title: "Hazard-zone warning",
      body: "A new flooded hazard zone was added near your location. Please avoid the area.",
      createdAt: isoFromMinutesAgo(10),
      readAt: null,
      isRead: false,
      status: "UNREAD",
      priority: "CRITICAL",
      recipientRole: role,
      routeName: "/(tabs)/map",
      metadata: { source: "mock" },
    },
    {
      id: "mock-weather-1",
      type: "WEATHER_ADVISORY",
      category: "ALERT",
      title: "Weather advisory",
      body: "Moderate to heavy rainfall expected in your area in the next few hours.",
      createdAt: isoFromMinutesAgo(90),
      readAt: null,
      isRead: false,
      status: "UNREAD",
      priority: "HIGH",
      recipientRole: role,
      routeName: "/(tabs)/map",
      metadata: { source: "mock" },
    },
    {
      id: "mock-announcement-1",
      type: "LGU_ANNOUNCEMENT",
      category: "ANNOUNCEMENT",
      title: "LGU announcement",
      body: "Emergency operations center hotline is available 24/7 for urgent incidents.",
      createdAt: isoFromMinutesAgo(640),
      readAt: isoFromMinutesAgo(200),
      isRead: true,
      status: "READ",
      priority: "NORMAL",
      recipientRole: role,
      metadata: { source: "mock" },
    },
  ];

  const roleSpecific: Record<NotificationRole, MobileNotificationItem[]> = {
    community_member: [
      {
        id: "mock-community-1",
        type: "RESPONDER_EN_ROUTE",
        category: "UPDATE",
        title: "Responder en route",
        body: "A responder is currently on the way to your request location.",
        createdAt: isoFromMinutesAgo(28),
        readAt: null,
        isRead: false,
        status: "UNREAD",
        priority: "HIGH",
        recipientRole: role,
        routeName: "/my-request-tracking",
        routeParams: { id: "mock-request-123" },
        metadata: { source: "mock" },
      },
    ],
    volunteer: [
      {
        id: "mock-volunteer-1",
        type: "NEW_TASK_ASSIGNED",
        category: "TASK",
        title: "New task assigned",
        body: "You have a new emergency assignment. Open Tasks to respond.",
        createdAt: isoFromMinutesAgo(14),
        readAt: null,
        isRead: false,
        status: "UNREAD",
        priority: "HIGH",
        recipientRole: role,
        routeName: "/(tabs)/tasks",
        metadata: { source: "mock" },
      },
    ],
    responder: [
      {
        id: "mock-responder-1",
        type: "ROUTE_UPDATED",
        category: "TASK",
        title: "Route updated",
        body: "A safer route to your assigned emergency has been computed.",
        createdAt: isoFromMinutesAgo(16),
        readAt: null,
        isRead: false,
        status: "UNREAD",
        priority: "HIGH",
        recipientRole: role,
        routeName: "/(tabs)/tasks",
        metadata: { source: "mock" },
      },
    ],
    barangay_official: [
      {
        id: "mock-lgu-1",
        type: "NEW_EMERGENCY_REPORT_RECEIVED",
        category: "UPDATE",
        title: "New emergency report received",
        body: "A new community emergency report needs verification.",
        createdAt: isoFromMinutesAgo(21),
        readAt: null,
        isRead: false,
        status: "UNREAD",
        priority: "HIGH",
        recipientRole: role,
        metadata: { source: "mock" },
      },
    ],
    cdrmo_admin: [
      {
        id: "mock-cdrmo-1",
        type: "ESCALATED_INCIDENT",
        category: "UPDATE",
        title: "Escalated incident",
        body: "An incident in your area was escalated and requires immediate attention.",
        createdAt: isoFromMinutesAgo(12),
        readAt: null,
        isRead: false,
        status: "UNREAD",
        priority: "CRITICAL",
        recipientRole: role,
        metadata: { source: "mock" },
      },
    ],
    super_admin: [
      {
        id: "mock-super-1",
        type: "SYSTEM_DISPATCH_UPDATE",
        category: "UPDATE",
        title: "System dispatch update",
        body: "Multiple responder dispatch updates were recorded across LGUs.",
        createdAt: isoFromMinutesAgo(18),
        readAt: null,
        isRead: false,
        status: "UNREAD",
        priority: "HIGH",
        recipientRole: role,
        metadata: { source: "mock" },
      },
    ],
    unknown: [],
  };

  return [...roleSpecific[role], ...base]
    .filter((item) => roleSupportsNotificationType(role, item.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
