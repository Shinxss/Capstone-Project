export type ActivityEntityType =
  | "dispatch"
  | "emergency"
  | "announcement"
  | "profile"
  | "settings"
  | "notification"
  | "report"
  | "system";

export type ActivityLogEntry = {
  id: string;
  actor: string;
  action: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  timestamp: string; // ISO
  metadata?: Record<string, unknown> | null;
};

export type ActivityLogFilters = {
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
  action: string;
  actor: string;
};

