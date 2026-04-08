import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { showInAppNotification } from "../components/InAppNotificationHost";
import { normalizeNotificationType } from "../constants/notification.constants";
import { addMobileNotification } from "../services/mobileNotificationsStore";
import {
  registerPushToken,
  unregisterPushToken,
} from "../services/pushRegistrationApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DISPATCH_CHANNEL_ID = "lifeline_dispatch_v6";
const ALERTS_CHANNEL_ID = "lifeline_alerts_v2";

function normalizeStep(raw: unknown) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ");
}

function typeFromPushData(data: Record<string, unknown>) {
  const rawType = String(data?.type ?? "").trim().toUpperCase();
  if (rawType === "REQUEST_UPDATE") {
    const step = normalizeStep(data?.step);
    if (step === "APPROVED" || step === "VERIFIED") return "EMERGENCY_VERIFIED";
    if (step === "ASSIGNED") return "RESPONDER_DISPATCHED";
    if (step === "EN ROUTE") return "RESPONDER_EN_ROUTE";
    if (step === "ARRIVED") return "RESPONDER_ARRIVED";
    if (step === "RESOLVED") return "EMERGENCY_RESOLVED";
    return "HELP_REQUEST_ACKNOWLEDGED";
  }

  if (rawType === "DISPATCH_OFFER") {
    return "NEW_TASK_ASSIGNED";
  }

  return normalizeNotificationType(rawType);
}

function getProjectId(): string | undefined {
  const easProjectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (typeof easProjectId === "string" && easProjectId.trim()) {
    return easProjectId;
  }

  return undefined;
}

async function ensureNotificationChannels() {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(DISPATCH_CHANNEL_ID, {
      name: "Dispatch Alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: "alarm.wav",
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  } catch (error) {
    console.warn("[push] dispatch channel setup failed", error);
  }

  try {
    await Notifications.setNotificationChannelAsync(ALERTS_CHANNEL_ID, {
      name: "General Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  } catch (error) {
    console.warn("[push] alerts channel setup failed", error);
  }
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.info("[push] registration skipped: requires physical device");
    return null;
  }

  await ensureNotificationChannels();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    console.info("[push] registration skipped: notification permission not granted", { status });
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn("[push] EAS projectId missing. Falling back to getExpoPushTokenAsync() without explicit project id");
  }

  try {
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = String(tokenResponse.data || "").trim();
    if (!token) {
      console.warn("[push] getExpoPushTokenAsync returned empty token");
      return null;
    }

    return token;
  } catch (error) {
    console.warn("[push] getExpoPushTokenAsync failed", error);
    return null;
  }
}

export function usePushNotificationsBootstrap() {
  const router = useRouter();
  const { hydrated, mode, user } = useAuth();
  const registeredUserIdRef = useRef<string | null>(null);
  const registeredTokenRef = useRef<string | null>(null);

  const resolveNotificationTarget = (data: Record<string, unknown>) => {
    const kind = String(data?.type ?? "").trim().toUpperCase();

    if (kind === "REQUEST_UPDATE") {
      const requestId = String(data?.requestId ?? "").trim();
      if (!requestId) return null;
      return {
        pathname: "/my-request-tracking",
        params: { id: requestId },
      };
    }

    if (kind === "DISPATCH_OFFER") {
      return {
        pathname: "/(tabs)/tasks",
      };
    }

    if (kind === "DISPATCH_OFFER".toLowerCase()) {
      return {
        pathname: "/(tabs)/tasks",
      };
    }

    if (kind === "WEATHER_ADVISORY" || kind === "HAZARD_ZONE_WARNING") {
      return {
        pathname: "/(tabs)/map",
      };
    }

    return null;
  };

  const routeFromNotificationData = (data: Record<string, unknown>) => {
    const target = resolveNotificationTarget(data);
    if (!target) return;
    router.push({
      pathname: target.pathname as never,
      params: target.params as never,
    });
  };

  useEffect(() => {
    const addToFeedFromPush = (notification: Notifications.Notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      const title = String(notification.request.content.title ?? "Lifeline update").trim() || "Lifeline update";
      const body = String(notification.request.content.body ?? "").trim() || "You have a new update.";
      const type = typeFromPushData(data);
      const requestId = String(data?.requestId ?? "").trim();
      const dispatchId = String(data?.dispatchId ?? "").trim();
      const notificationId = String(data?.notificationId ?? "").trim();
      const dedupeId =
        notificationId ||
        `push:${type}:${requestId || dispatchId || String(notification.date ?? Date.now())}`;

      void addMobileNotification({
        id: dedupeId,
        type,
        title,
        body,
        createdAt: new Date(notification.date ?? Date.now()).toISOString(),
        routeName: resolveNotificationTarget(data)?.pathname,
        routeParams: resolveNotificationTarget(data)?.params,
        relatedEntityType: requestId ? "REQUEST" : dispatchId ? "TASK" : undefined,
        relatedEntityId: requestId || dispatchId || undefined,
        metadata: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value ?? "")])
        ),
      });
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      addToFeedFromPush(response.notification);
      const data = response.notification.request.content.data as Record<string, unknown>;
      routeFromNotificationData(data);
    });

    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      addToFeedFromPush(notification);
      const data = notification.request.content.data as Record<string, unknown>;
      const target = resolveNotificationTarget(data);
      const title = String(notification.request.content.title ?? "Lifeline update").trim();
      const body = String(notification.request.content.body ?? "").trim();
      if (!title && !body) return;

      showInAppNotification({
        title: title || "Lifeline update",
        body,
        target: target ?? undefined,
        tone: "info",
      });
    });

    return () => {
      responseSubscription.remove();
      foregroundSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    if (Platform.OS !== "android") return;
    void ensureNotificationChannels();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (mode !== "authed" || !user?.id) {
      const activeToken = registeredTokenRef.current;
      if (activeToken) {
        void unregisterPushToken(activeToken).catch(() => undefined);
      }
      registeredUserIdRef.current = null;
      registeredTokenRef.current = null;
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const runRegistration = async () => {
      if (registeredUserIdRef.current === user.id) return;

      try {
        const expoPushToken = await getExpoPushToken();
        if (!expoPushToken || cancelled) return;

        await registerPushToken({
          expoPushToken,
          platform: Platform.OS === "ios" ? "ios" : "android",
        });

        if (!cancelled) {
          registeredUserIdRef.current = user.id;
          registeredTokenRef.current = expoPushToken;
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (error) {
        console.warn("[push] registration failed", error);
      }
    };

    void runRegistration();
    timer = setInterval(() => {
      void runRegistration();
    }, 60_000);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [hydrated, mode, user?.id]);
}
