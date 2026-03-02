import { z } from "zod";

const expoPushTokenPattern = /^ExponentPushToken\[[^\]]+\]$/;

export const registerPushSchema = z
  .object({
    token: z.string().trim().regex(expoPushTokenPattern, "Invalid Expo push token"),
    platform: z.enum(["android", "ios"]),
  })
  .strict();

export const unregisterPushSchema = z
  .object({
    token: z.string().trim().regex(expoPushTokenPattern, "Invalid Expo push token"),
  })
  .strict();

export const updatePushPreferencesSchema = z
  .object({
    communityRequestUpdates: z.boolean().optional(),
    volunteerAssignments: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      typeof value.communityRequestUpdates === "boolean" ||
      typeof value.volunteerAssignments === "boolean",
    "At least one preference must be provided"
  );
