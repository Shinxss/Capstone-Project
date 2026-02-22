import type { Request, Response } from "express";
import {
  getUserPushTokens,
  registerPushToken,
  sendTestDispatchPushToUser,
  unregisterPushToken,
} from "./pushNotification.service";
import {
  queryNotificationStates,
  setNotificationArchivedState,
  setNotificationReadState,
} from "./notificationState.service";

function requireUserId(req: Request, res: Response) {
  const userId = String(req.user?.id || "");
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
}

export async function registerPushTokenController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    await registerPushToken({
      userId,
      expoPushToken: String(req.body?.expoPushToken || ""),
      platform: req.body?.platform,
    });

    console.info("[push] token registered", {
      userId,
      platform: req.body?.platform,
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.warn("[push] token registration failed", {
      userId: String(req.user?.id || ""),
      message: error?.message,
    });
    return res.status(400).json({ message: error?.message ?? "Failed to register push token" });
  }
}

export async function unregisterPushTokenController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    await unregisterPushToken(userId, String(req.body?.expoPushToken || ""));
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to unregister push token" });
  }
}

export async function getMyPushTokensController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const tokens = await getUserPushTokens(userId);
    return res.status(200).json({
      count: tokens.length,
      activeCount: tokens.filter((token) => token.isActive).length,
      tokens,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to read push tokens" });
  }
}

export async function sendMyTestPushController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const result = await sendTestDispatchPushToUser(userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to send test push" });
  }
}

export async function queryNotificationStateController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const states = await queryNotificationStates(userId, ids);
    return res.status(200).json({ states });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to load notification state" });
  }
}

export async function setNotificationReadController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const read = Boolean(req.body?.read ?? true);
    const result = await setNotificationReadState(userId, ids, read);
    return res.status(200).json({ ok: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to update read state" });
  }
}

export async function setNotificationArchivedController(req: Request, res: Response) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const archived = Boolean(req.body?.archived ?? true);
    const result = await setNotificationArchivedState(userId, ids, archived);
    return res.status(200).json({ ok: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message ?? "Failed to update archived state" });
  }
}
