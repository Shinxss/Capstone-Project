import type { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../users/user.model";
import { registerPushToken, unregisterPushToken } from "../notifications/pushNotification.service";

function getRequestUserId(req: Request, res: Response) {
  const userId = String(req.user?.id || "").trim();
  if (!Types.ObjectId.isValid(userId)) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  return userId;
}

export async function registerPushController(req: Request, res: Response) {
  try {
    const userId = getRequestUserId(req, res);
    if (!userId) return;

    await registerPushToken({
      userId,
      expoPushToken: String(req.body?.token ?? "").trim(),
      platform: req.body?.platform,
    });

    console.info("[push] token registered", {
      userId,
      platform: req.body?.platform,
      route: "/api/push/register",
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.warn("[push] token registration failed", {
      userId: String(req.user?.id || ""),
      message: error?.message,
      route: "/api/push/register",
    });
    return res.status(400).json({ message: error?.message ?? "Failed to register push token" });
  }
}

export async function unregisterPushController(req: Request, res: Response) {
  try {
    const userId = getRequestUserId(req, res);
    if (!userId) return;

    await unregisterPushToken(userId, String(req.body?.token ?? "").trim());
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to unregister push token" });
  }
}

export async function updatePushPreferencesController(req: Request, res: Response) {
  try {
    const userId = getRequestUserId(req, res);
    if (!userId) return;

    const updates: Record<string, boolean> = {};

    if (typeof req.body?.communityRequestUpdates === "boolean") {
      updates["notificationPrefs.communityRequestUpdates"] = Boolean(req.body.communityRequestUpdates);
    }

    if (typeof req.body?.volunteerAssignments === "boolean") {
      updates["notificationPrefs.volunteerAssignments"] = Boolean(req.body.volunteerAssignments);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "At least one preference must be provided" });
    }

    await User.updateOne({ _id: new Types.ObjectId(userId) }, { $set: updates });

    const user = await User.findById(userId)
      .select("notificationPrefs")
      .lean();

    return res.status(200).json({
      ok: true,
      notificationPrefs: {
        communityRequestUpdates: Boolean(
          user?.notificationPrefs?.communityRequestUpdates ?? true
        ),
        volunteerAssignments: Boolean(user?.notificationPrefs?.volunteerAssignments ?? true),
        marketing: Boolean(user?.notificationPrefs?.marketing ?? false),
      },
    });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to update push preferences" });
  }
}

export async function getPushPreferencesController(req: Request, res: Response) {
  try {
    const userId = getRequestUserId(req, res);
    if (!userId) return;

    const user = await User.findById(userId)
      .select("notificationPrefs role volunteerStatus onDuty")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      notificationPrefs: {
        communityRequestUpdates: Boolean(
          user.notificationPrefs?.communityRequestUpdates ?? true
        ),
        volunteerAssignments: Boolean(user.notificationPrefs?.volunteerAssignments ?? true),
        marketing: Boolean(user.notificationPrefs?.marketing ?? false),
      },
      role: String(user.role ?? ""),
      volunteerStatus: String(user.volunteerStatus ?? ""),
      onDuty: Boolean((user as { onDuty?: unknown }).onDuty ?? true),
    });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to fetch push preferences" });
  }
}
