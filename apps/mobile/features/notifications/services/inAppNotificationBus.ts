type InAppNotificationTarget = {
  pathname: string;
  params?: Record<string, string>;
};

export type InAppNotificationPayload = {
  id?: string;
  title: string;
  body?: string;
  target?: InAppNotificationTarget;
  tone?: "info" | "success" | "warning";
};

type Listener = (payload: InAppNotificationPayload) => void;

const listeners = new Set<Listener>();

export function publishInAppNotification(payload: InAppNotificationPayload) {
  for (const listener of listeners) {
    listener(payload);
  }
}

export function subscribeInAppNotification(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
