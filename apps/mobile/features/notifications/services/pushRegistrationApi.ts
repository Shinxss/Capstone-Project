import { api } from "../../../lib/api";
import axios from "axios";

type PlatformType = "android" | "ios";

export type NotificationPreferencesDTO = {
  notificationPrefs: {
    communityRequestUpdates: boolean;
    volunteerAssignments: boolean;
    marketing?: boolean;
  };
  role?: string;
  volunteerStatus?: string;
  onDuty?: boolean;
};

export async function registerPushToken(input: {
  expoPushToken: string;
  platform: PlatformType;
}) {
  try {
    await api.post("/api/push/register", {
      token: input.expoPushToken,
      platform: input.platform,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await api.post("/api/notifications/push-token", input);
      return;
    }
    throw error;
  }
}

export async function unregisterPushToken(expoPushToken: string) {
  try {
    await api.post("/api/push/unregister", {
      token: expoPushToken,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await api.delete("/api/notifications/push-token", {
        data: { expoPushToken },
      });
      return;
    }
    throw error;
  }
}

export async function fetchPushPreferences() {
  const res = await api.get<NotificationPreferencesDTO>("/api/push/preferences");
  return res.data;
}

export async function updatePushPreferences(input: {
  communityRequestUpdates?: boolean;
  volunteerAssignments?: boolean;
}) {
  const res = await api.patch<NotificationPreferencesDTO>("/api/push/preferences", input);
  return res.data;
}
