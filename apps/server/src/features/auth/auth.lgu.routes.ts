import bcrypt from "bcryptjs";
import { Router } from "express";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit, logSecurityEvent } from "../audit/audit.service";
import { User } from "../users/user.model";
import { loginLimiter } from "../../middlewares/rateLimit";
import { validate } from "../../middlewares/validate";
import { signAccessToken } from "../../utils/jwt";
import { lguLoginSchema } from "./auth.schemas";
import { createMfaChallenge, maskEmail } from "../../utils/mfa";
import { sendOtpEmail } from "../../utils/mailer";
import { resolveAccessTokenExpiresIn } from "./accessTokenExpiry";

const INVALID_CREDENTIALS = "Invalid credentials";

export const lguAuthRouter = Router();

lguAuthRouter.post("/login", loginLimiter, validate(lguLoginSchema), async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    const user = await User.findOne({
      username,
      role: { $in: ["LGU", "ADMIN"] },
    }).lean();

    if (!user || !user.isActive || !user.passwordHash) {
      await logSecurityEvent(req, AUDIT_EVENT.AUTH_LOGIN_FAIL, "FAIL", {
        username,
      });
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await logSecurityEvent(req, AUDIT_EVENT.AUTH_LOGIN_FAIL, "FAIL", {
        username,
      });
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    if (user.role === "ADMIN") {
      if (!user.email) {
        return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
      }

      const { challengeId, code } = await createMfaChallenge(user._id, 5);
      await sendOtpEmail({
        to: user.email,
        otp: code,
        actionText: "Admin Login Verification",
        expiryTime: 5,
      });

      await logAudit(req, {
        eventType: AUDIT_EVENT.AUTH_MFA_CHALLENGE_SENT,
        outcome: "SUCCESS",
        actor: {
          id: user._id.toString(),
          role: user.role,
          email: user.email,
        },
        target: {
          type: "USER",
          id: user._id.toString(),
        },
        metadata: {
          mfaRequired: true,
          challengeId,
        },
      });

      return res.json({
        success: true,
        data: {
          mfaRequired: true,
          role: "ADMIN",
          challengeId,
          emailMasked: maskEmail(user.email),
          user: {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      });
    }

    const token = signAccessToken(
      { sub: user._id.toString(), role: user.role },
      { expiresIn: resolveAccessTokenExpiresIn(req) }
    );

    await logAudit(req, {
      eventType: AUDIT_EVENT.AUTH_LOGIN_SUCCESS,
      outcome: "SUCCESS",
      actor: {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      target: {
        type: "USER",
        id: user._id.toString(),
      },
      metadata: {
        role: user.role,
        loginChannel: "password",
      },
    });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        role: "LGU",
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          lguName: user.lguName,
          lguPosition: user.lguPosition,
          barangay: user.barangay,
          municipality: user.municipality,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
