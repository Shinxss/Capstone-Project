export type NotificationPrefs = {
  emergencies: boolean;
  taskUpdates: boolean;
  verificationNeeded: boolean;
  announcements: boolean;
};

export type UiPrefs = {
  defaultPageSize: number;
};

export type LguSettings = {
  notifications: NotificationPrefs;
  ui: UiPrefs;
  updatedAt: string; // ISO
};

