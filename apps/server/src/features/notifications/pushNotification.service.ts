import { Types } from "mongoose";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { User } from "../users/user.model";
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
  dispatchByVolunteerId?: Record<string, string>;
};

type RequestStatusPushInput = {
  userId: string;
  requestId: string;
  step: string;
  title: string;
  body: string;
};

type SendPushToUserInput = {
  title: string;
  body: string;
  channelId?: string;
  sound?: string | null;
  priority?: ExpoPushMessage["priority"];
  data?: Record<string, unknown>;
};

const PUSH_DEDUPE_MS = 60_000;
const pushStepDedupe = new Map<string, number>();

function allowPushForStep(key: string) {
  const now = Date.now();
  const lastSentAt = pushStepDedupe.get(key) ?? 0;
  if (now - lastSentAt < PUSH_DEDUPE_MS) return false;
  pushStepDedupe.set(key, now);
  return true;
}

function normalizeObjectId(id: string) {
  const value = String(id || "").trim();
  return Types.ObjectId.isValid(value) ? value : null;
}

function uniqueValidObjectIds(values: string[]) {
  return Array.from(new Set((values ?? []).map((value) => String(value || "").trim()))).filter((value) =>
    Types.ObjectId.isValid(value)
  );
}

async function listActiveExpoTokensForUsers(userIds: string[]) {
  const normalizedIds = uniqueValidObjectIds(userIds);
  if (normalizedIds.length === 0) return [] as string[];

  const rows = await PushToken.find({
    userId: { $in: normalizedIds.map((id) => new Types.ObjectId(id)) },
    isActive: true,
  })
    .select("expoPushToken")
    .lean();

  return rows
    .map((row) => String(row.expoPushToken || "").trim())
    .filter((token) => Expo.isExpoPushToken(token));
}

async function sendExpoMessages(messages: ExpoPushMessage[]) {
  if (messages.length === 0) {
    return { attempted: 0, sent: 0 };
  }

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
      if (ticket.details?.error !== "DeviceNotRegistered") return;
      const token = chunk[index]?.to;
      if (typeof token === "string") {
        deactivateTokens.add(token);
      }
    });
  }

  if (deactivateTokens.size > 0) {
    await PushToken.updateMany(
      { expoPushToken: { $in: Array.from(deactivateTokens) } },
      { $set: { isActive: false } }
    );
  }

  return {
    attempted: messages.length,
    sent: sentCount,
  };
}

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

export async function sendPushToUser(userId: string, messages: SendPushToUserInput[]) {
  const normalizedUserId = normalizeObjectId(userId);
  if (!normalizedUserId) {
    throw new Error("Invalid user id");
  }

  const tokens = await listActiveExpoTokensForUsers([normalizedUserId]);
  if (tokens.length === 0 || messages.length === 0) {
    return { attempted: 0, sent: 0 };
  }

  const payloads: ExpoPushMessage[] = [];
  for (const token of tokens) {
    for (const message of messages) {
      payloads.push({
        to: token,
        title: message.title,
        body: message.body,
        channelId: message.channelId ?? "lifeline_alerts",
        sound: message.sound ?? undefined,
        priority: message.priority ?? "high",
        data: message.data,
      });
    }
  }

  return sendExpoMessages(payloads);
}

export async function sendRequestStatusPush(input: RequestStatusPushInput) {
  const userId = normalizeObjectId(input.userId);
  const requestId = String(input.requestId || "").trim();
  const step = String(input.step || "").trim();
  if (!userId || !requestId || !step) {
    return { attempted: 0, sent: 0 };
  }

  const canPush = allowPushForStep(`request:${userId}:${requestId}:${step.toUpperCase()}`);
  if (!canPush) {
    return { attempted: 0, sent: 0 };
  }

  const user = await User.findById(userId)
    .select("notificationPrefs.communityRequestUpdates")
    .lean();

  const enabled = Boolean(user?.notificationPrefs?.communityRequestUpdates ?? true);
  if (!enabled) {
    return { attempted: 0, sent: 0 };
  }

  return sendPushToUser(userId, [
    {
      title: input.title,
      body: input.body,
      channelId: "lifeline_alerts",
      sound: null,
      data: {
        type: "REQUEST_UPDATE",
        requestId,
        step,
        screen: "my-request-tracking",
      },
    },
  ]);
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
  const volunteerUserIds = uniqueValidObjectIds(input.volunteerUserIds ?? []);

  if (volunteerUserIds.length === 0) {
    console.info("[push] no valid volunteer user ids for dispatch push");
    return { attempted: 0, sent: 0 };
  }

  const canPushUsers = await User.find({
    _id: { $in: volunteerUserIds.map((id) => new Types.ObjectId(id)) },
    $or: [
      { "notificationPrefs.volunteerAssignments": { $exists: false } },
      { "notificationPrefs.volunteerAssignments": true },
    ],
  })
    .select("_id")
    .lean();

  const enabledVolunteerUserIds = canPushUsers.map((row) => String(row._id));
  if (enabledVolunteerUserIds.length === 0) {
    return { attempted: 0, sent: 0 };
  }

  const tokenRows = await PushToken.find({
    userId: { $in: enabledVolunteerUserIds.map((id) => new Types.ObjectId(id)) },
    isActive: true,
  })
    .select("expoPushToken userId")
    .lean();

  const validTokenRows = tokenRows.filter((row) =>
    Expo.isExpoPushToken(String(row.expoPushToken || "").trim())
  );

  if (validTokenRows.length === 0) {
    console.info("[push] no active Expo tokens for volunteers", {
      volunteerCount: enabledVolunteerUserIds.length,
    });
    return { attempted: 0, sent: 0 };
  }

  const typeLabel = String(input.emergencyType || "Emergency").toLowerCase();

  const messages: ExpoPushMessage[] = validTokenRows.map((row) => {
    const token = String(row.expoPushToken || "").trim();
    const volunteerId = String(row.userId ?? "");
    const dispatchId = String(input.dispatchByVolunteerId?.[volunteerId] ?? "").trim();

    return {
      to: token,
      title: "New dispatch assignment",
      body: `You have a new ${typeLabel} dispatch. Tap to respond.`,
      sound: "siren.wav",
      channelId: "lifeline_dispatch",
      priority: "high",
      data: {
        type: "DISPATCH_OFFER",
        dispatchId: dispatchId || undefined,
        requestId: input.emergencyId,
        emergencyId: input.emergencyId,
        screen: "task-details",
      },
    };
  });
  const sent = await sendExpoMessages(messages);

  console.info("[push] expo send summary", {
    attempted: sent.attempted,
    sent: sent.sent,
  });

  return {
    attempted: sent.attempted,
    sent: sent.sent,
  };
}
