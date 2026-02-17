import type { Request, Response } from "express";
import { Types } from "mongoose";
import { logAuditEvent, getAuditActor, getAuditRequestContext } from "../audit/audit.service";
import { User } from "../users/user.model";
import { verifyMfaChallenge } from "../../utils/mfa";
import { signAccessToken } from "../../utils/jwt";
import { authenticateUser } from "./auth.service";
import { toAuthUserPayload } from "./otp.utils";
import { TokenBlocklist } from "./TokenBlocklist.model";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.status(200).json({
      token,
      accessToken: token,
      user: toAuthUserPayload(user),
    });
  } catch {
    return res.status(500).json({ message: "Login failed." });
  }
}

export async function adminMfaVerify(req: Request, res: Response) {
  try {
    const { challengeId, code } = req.body as { challengeId?: string; code?: string };

    if (!challengeId || !code) {
      return res.status(400).json({ success: false, error: "challengeId and code are required" });
    }

    const userId = await verifyMfaChallenge(challengeId, String(code).trim());
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    if (!user.isActive) return res.status(403).json({ success: false, error: "Account is disabled" });
    if (user.role !== "ADMIN") return res.status(403).json({ success: false, error: "Not allowed" });

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        role: "ADMIN",
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    return res.status(401).json({ success: false, error: err?.message || "OTP verification failed" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select(
      "firstName lastName email role authProvider passwordHash googleSub emailVerified volunteerStatus"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      user: toAuthUserPayload(user),
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch profile." });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const auth = req.auth;
    if (!auth?.jti || !auth?.sub || typeof auth.exp !== "number") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const expiresAt = new Date(auth.exp * 1000);
    const userId = new Types.ObjectId(auth.sub);

    await TokenBlocklist.updateOne(
      { jti: auth.jti },
      {
        $setOnInsert: {
          jti: auth.jti,
          userId,
          expiresAt,
          reason: "logout",
        },
      },
      { upsert: true }
    );

    const actor = getAuditActor(req);
    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: actor.actorId || auth.sub,
      actorRole: actor.actorRole || auth.role || "",
      action: "AUTH_LOGOUT",
      targetType: "User",
      targetId: auth.sub,
      metadata: {},
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return res.status(200).json({ success: true });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
