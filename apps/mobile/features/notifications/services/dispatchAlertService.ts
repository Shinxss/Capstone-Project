import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { DISPATCH_CHANNEL_ID } from "../hooks/usePushNotificationsBootstrap";

let lastAlertAt = 0;
let lastAlertDispatchId = "";

export type DispatchAlertParams = {
  title?: string;
  body?: string;
  dispatchId?: string;
  requestId?: string;
};

/**
 * Triggers high-priority audible and tactile alert for volunteer/responder deployments.
 * Deduplicates multiple rapid triggers (e.g. push + websocket arriving within seconds).
 */
export async function playDispatchAlert(params: DispatchAlertParams) {
  const now = Date.now();
  const dispatchId = String(params.dispatchId ?? "").trim();

  // Deduplicate if fired within 4 seconds for the same dispatch, or 2 seconds globally
  if (dispatchId && dispatchId === lastAlertDispatchId && now - lastAlertAt < 4000) {
    return;
  }
  if (now - lastAlertAt < 2000) {
    return;
  }
  lastAlertAt = now;
  if (dispatchId) lastAlertDispatchId = dispatchId;

  // 1. Tactile haptic alert (heavy error/warning vibration pattern)
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics not supported or permitted on this hardware
  }

  // 2. Schedule immediate notification on DISPATCH_CHANNEL_ID.
  // On Android, this triggers the custom alarm sound ('alarm.wav') and high-priority heads-up banner
  try {
    const title = params.title || "🚨 Emergency Dispatch Alert";
    const body = params.body || "You have been deployed to an emergency response. Tap to respond immediately!";

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "alarm.wav",
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 250, 500],
        data: {
          type: "DISPATCH_OFFER",
          dispatchId: params.dispatchId,
          requestId: params.requestId,
          screen: "task-details",
        },
      },
      trigger: Platform.OS === "android" ? { channelId: DISPATCH_CHANNEL_ID } : null,
    });
  } catch (error) {
    console.warn("[dispatchAlert] failed to trigger alert notification", error);
  }
}
