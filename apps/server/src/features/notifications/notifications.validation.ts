import { z } from "zod";

const notificationIdsSchema = z.array(z.string().trim().min(1)).max(500);

export const registerPushTokenSchema = z
  .object({
    expoPushToken: z.string().trim().min(1),
    platform: z.enum(["android", "ios"]),
  })
  .strict();

export const unregisterPushTokenSchema = z
  .object({
    expoPushToken: z.string().trim().min(1),
  })
  .strict();

export const queryNotificationStateSchema = z
  .object({
    ids: notificationIdsSchema.default([]),
  })
  .strict();

export const setNotificationReadSchema = z
  .object({
    ids: notificationIdsSchema.min(1),
    read: z.boolean().optional().default(true),
  })
  .strict();

export const setNotificationArchivedSchema = z
  .object({
    ids: notificationIdsSchema.min(1),
    archived: z.boolean().optional().default(true),
  })
  .strict();
