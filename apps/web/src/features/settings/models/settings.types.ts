export type NotificationChannelPrefs = {
  web: boolean;
  email: boolean;
};

export type NotificationPrefs = {
  emergencies: NotificationChannelPrefs;
  taskUpdates: NotificationChannelPrefs;
  verificationNeeded: NotificationChannelPrefs;
  announcements: NotificationChannelPrefs;
};

export type UiPrefs = {
  defaultPageSize: number;
};

export type LguSettings = {
  notifications: NotificationPrefs;
  ui: UiPrefs;
  updatedAt: string; // ISO
};
