import { api } from "../../../lib/api";

type PlatformType = "android" | "ios";

export async function registerPushToken(input: {
  expoPushToken: string;
  platform: PlatformType;
}) {
  await api.post("/api/notifications/push-token", input);
}

export async function unregisterPushToken(expoPushToken: string) {
  await api.delete("/api/notifications/push-token", {
    data: { expoPushToken },
  });
}
