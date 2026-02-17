import bcrypt from "bcryptjs";
import { Router } from "express";
import { logAuditEvent, getAuditRequestContext } from "../audit/audit.service";
import { User } from "../users/user.model";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimit";
import { validate } from "../../middlewares/validate";
import { signAccessToken } from "../../utils/jwt";
import { communityLoginSchema, communityRegisterSchema } from "./auth.schemas";
import { toAuthUserPayload } from "./otp.utils";

const INVALID_CREDENTIALS = "Invalid credentials";

export const communityAuthRouter = Router();

communityAuthRouter.post("/register", registerLimiter, validate(communityRegisterSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body as {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };

    const cleanEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ success: false, error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: cleanEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      passwordHash,
      authProvider: "local",
      emailVerified: true,
      role: "COMMUNITY",
      volunteerStatus: "NONE",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        volunteerStatus: user.volunteerStatus,
      },
      message: "Account created.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

communityAuthRouter.post("/login", loginLimiter, validate(communityLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      role: { $in: ["COMMUNITY", "VOLUNTEER"] },
    });

    if (!user || !user.isActive || !user.emailVerified || !user.passwordHash) {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "AUTH_COMMUNITY_LOGIN_SUCCESS",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { role: user.role },
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        user: toAuthUserPayload(user),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
