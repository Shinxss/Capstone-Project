import type { Request, Response } from "express";
import { z } from "zod";
import { toAuthUserPayload } from "../auth/otp.utils";
import { User } from "./user.model";
import * as userService from "./user.service";
import { removeLocalProfileAvatarFileByUrl, uploadUserAvatar } from "./userAvatar.service";

type AuthedRequest = Request & { user?: { id: string; role?: string }; userId?: string };

const uploadMyAvatarSchema = z
  .object({
    base64: z.string().trim().min(1).max(4_500_000),
    mimeType: z.enum(["image/png", "image/jpeg", "image/heic"]).optional(),
    fileName: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

function isBadAvatarUploadMessage(message: string) {
  return (
    message === "base64 is required" ||
    message === "Invalid file type" ||
    message === "File too large"
  );
}

export async function getMyProfileSummary(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const summary = await userService.getUserProfileSummary(userId);
    if (!summary) return res.status(404).json({ message: "User not found" });

    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}

export async function listVolunteers(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role ?? "");
    if (!role || !["LGU", "ADMIN"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const onlyApproved = String(req.query.onlyApproved ?? "true") !== "false";
    const includeInactive = String(req.query.includeInactive ?? "true") !== "false";

    const items = await userService.listDispatchVolunteers({
      onlyApproved,
      includeInactive,
    });

    return res.json({ data: items });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}

export async function uploadMyAvatar(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const parsed = uploadMyAvatarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsed.error.flatten(),
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const previousAvatarUrl = String(user.avatarUrl ?? "").trim();
    const uploaded = await uploadUserAvatar({
      userId,
      base64: parsed.data.base64,
      mimeType: parsed.data.mimeType,
      fileName: parsed.data.fileName,
    });

    user.avatarUrl = uploaded.url;
    await user.save();

    if (previousAvatarUrl && previousAvatarUrl !== uploaded.url) {
      await removeLocalProfileAvatarFileByUrl(previousAvatarUrl).catch(() => undefined);
    }

    return res.status(201).json({
      success: true,
      avatarUrl: uploaded.url,
      user: toAuthUserPayload(user),
    });
  } catch (err: any) {
    const message = String(err?.message ?? "Failed to upload avatar");
    if (isBadAvatarUploadMessage(message)) {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "Failed to upload avatar" });
  }
}

export async function deleteMyAvatar(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const previousAvatarUrl = String(user.avatarUrl ?? "").trim();
    user.avatarUrl = "";
    await user.save();

    if (previousAvatarUrl) {
      await removeLocalProfileAvatarFileByUrl(previousAvatarUrl).catch(() => undefined);
    }

    return res.status(200).json({
      success: true,
      avatarUrl: null,
      user: toAuthUserPayload(user),
    });
  } catch {
    return res.status(500).json({ message: "Failed to remove avatar" });
  }
}
