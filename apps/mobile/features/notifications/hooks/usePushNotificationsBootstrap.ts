import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useAuth } from "../../auth/AuthProvider";
import { registerPushToken } from "../services/pushRegistrationApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  await Notifications.setNotificationChannelAsync("lifeline_dispatch", {
    name: "Dispatch Alerts",
    importance: Notifications.AndroidImportance.MAX,
    sound: "siren.wav",
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });

  await Notifications.setNotificationChannelAsync("lifeline_alerts", {
    name: "General Alerts",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
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
    return null;
  }

  const projectId = getProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
}

export function usePushNotificationsBootstrap() {
  const router = useRouter();
  const { hydrated, mode, user } = useAuth();
  const registeredUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const kind = String(data?.type ?? "").toLowerCase();
      if (kind === "dispatch_offer") {
        router.push("/(tabs)/map");
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!hydrated || mode !== "authed" || !user?.id) {
      if (mode !== "authed") {
        registeredUserIdRef.current = null;
      }
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
