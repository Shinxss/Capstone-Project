import { Types } from "mongoose";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { PushToken } from "./pushToken.model";

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

type RegisterPushTokenInput = {
  userId: string;
  expoPushToken: string;
  platform: "android" | "ios";
};

type DispatchPushInput = {
  volunteerUserIds: string[];
  emergencyId: string;
  emergencyType?: string;
};

export async function getUserPushTokens(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return [];

  const rows = await PushToken.find({ userId: new Types.ObjectId(userId) })
    .select("expoPushToken platform isActive lastSeenAt createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  return rows.map((row) => ({
    expoPushToken: String(row.expoPushToken || ""),
    platform: row.platform,
    isActive: Boolean(row.isActive),
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function sendTestDispatchPushToUser(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  const rows = await PushToken.find({
    userId: new Types.ObjectId(userId),
    isActive: true,
  })
    .select("expoPushToken")
    .lean();

  const tokens = rows
    .map((row) => String(row.expoPushToken || "").trim())
    .filter((token) => Expo.isExpoPushToken(token));

  if (tokens.length === 0) {
    return { attempted: 0, sent: 0, errors: [] as string[] };
  }

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title: "Lifeline test dispatch",
    body: "Test notification from local server. If you see this, push is working.",
    sound: "siren.wav",
    channelId: "lifeline_dispatch",
    priority: "high",
    data: {
      type: "dispatch_offer",
      emergencyId: "test-emergency",
      screen: "map",
      source: "manual_test",
    },
  }));

  let sentCount = 0;
  const errors = new Set<string>();
  for (const chunk of expo.chunkPushNotifications(messages)) {
    let tickets: ExpoPushTicket[] = [];
    try {
      tickets = await expo.sendPushNotificationsAsync(chunk);
    } catch (error: any) {
      errors.add(`send_exception:${String(error?.message ?? "unknown")}`);
      continue;
    }
    sentCount += tickets.filter((ticket) => ticket.status === "ok").length;

    tickets.forEach((ticket) => {
      if (ticket.status !== "error") return;
      const reason = ticket.details?.error ?? "unknown";
      const message = ticket.message ?? "";
      errors.add(`ticket_error:${String(reason)}${message ? `:${message}` : ""}`);
    });
  }

  if (errors.size > 0) {
    console.warn("[push] test send errors", {
      attempted: tokens.length,
      sent: sentCount,
      errors: Array.from(errors),
    });
  }

  return {
    attempted: tokens.length,
    sent: sentCount,
    errors: Array.from(errors),
  };
}

export async function registerPushToken(input: RegisterPushTokenInput) {
  const userId = String(input.userId || "").trim();
  const expoPushToken = String(input.expoPushToken || "").trim();

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id");
  }

  if (!Expo.isExpoPushToken(expoPushToken)) {
    throw new Error("Invalid Expo push token");
  }

  await PushToken.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
      expoPushToken,
    },
    {
      $set: {
        platform: input.platform,
        isActive: true,
        lastSeenAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

export async function unregisterPushToken(userId: string, expoPushToken: string) {
  if (!Types.ObjectId.isValid(userId)) return;
  const token = String(expoPushToken || "").trim();
  if (!token) return;

  await PushToken.updateOne(
    {
      userId: new Types.ObjectId(userId),
      expoPushToken: token,
    },
    {
      $set: {
        isActive: false,
      },
    }
  );
}

export async function sendDispatchOfferPush(input: DispatchPushInput) {
  const volunteerUserIds = Array.from(new Set((input.volunteerUserIds ?? []).map(String))).filter((id) =>
    Types.ObjectId.isValid(id)
  );

  if (volunteerUserIds.length === 0) {
    console.info("[push] no valid volunteer user ids for dispatch push");
    return { attempted: 0, sent: 0 };
  }

  const rows = await PushToken.find({
    userId: { $in: volunteerUserIds.map((id) => new Types.ObjectId(id)) },
    isActive: true,
  })
    .select("expoPushToken")
    .lean();

  const tokens = rows
    .map((row) => String(row.expoPushToken || "").trim())
    .filter((token) => Expo.isExpoPushToken(token));

  if (tokens.length === 0) {
    console.info("[push] no active Expo tokens for volunteers", {
      volunteerCount: volunteerUserIds.length,
    });
    return { attempted: 0, sent: 0 };
  }

  const typeLabel = String(input.emergencyType || "Emergency").toLowerCase();

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title: "New dispatch assignment",
    body: `You have a new ${typeLabel} dispatch. Tap to respond.`,
    sound: "siren.wav",
    channelId: "lifeline_dispatch",
    priority: "high",
    data: {
      type: "dispatch_offer",
      emergencyId: input.emergencyId,
      screen: "map",
    },
  }));

  let sentCount = 0;
  const deactivateTokens = new Set<string>();

  for (const chunk of expo.chunkPushNotifications(messages)) {
    let tickets: ExpoPushTicket[] = [];
    try {
      tickets = await expo.sendPushNotificationsAsync(chunk);
    } catch {
      continue;
    }

    sentCount += tickets.filter((ticket) => ticket.status === "ok").length;

    tickets.forEach((ticket, index) => {
      if (ticket.status !== "error") return;
      const error = ticket.details?.error;
      if (error === "DeviceNotRegistered") {
        const token = chunk[index]?.to;
        if (typeof token === "string") {
          deactivateTokens.add(token);
        }
      }
    });
  }

  if (deactivateTokens.size > 0) {
    await PushToken.updateMany(
      { expoPushToken: { $in: Array.from(deactivateTokens) } },
      { $set: { isActive: false } }
    );
  }

  console.info("[push] expo send summary", {
    attempted: tokens.length,
    sent: sentCount,
    deactivated: deactivateTokens.size,
  });

  return {
    attempted: tokens.length,
    sent: sentCount,
  };
}
