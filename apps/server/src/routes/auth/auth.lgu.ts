import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../../models/User";
import { signAccessToken } from "../../utils/jwt";
import { createMfaChallenge, maskEmail } from "../../utils/mfa";
import { sendOtpEmail } from "../../utils/mailer";

export const lguAuthRouter = Router();

lguAuthRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "username and password are required" });
    }

    // ✅ Allow both LGU and ADMIN to use this same login endpoint
    const user = await User.findOne({
      username,
      role: { $in: ["LGU", "ADMIN"] },
    }).lean();

    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ success: false, error: "Account is disabled" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

    // ✅ ADMIN => MFA required (send OTP email)
    if (user.role === "ADMIN") {
      if (!user.email) {
        return res.status(400).json({ success: false, error: "Admin email missing for MFA" });
      }

      const { challengeId, code } = await createMfaChallenge(user._id, 5);

      await sendOtpEmail({
        to: user.email,
        otp: code,
        actionText: "Admin Login Verification",
        expiryTime: 5,
      });

      return res.json({
        success: true,
        data: {
          mfaRequired: true,
          role: "ADMIN",
          challengeId,
          emailMasked: maskEmail(user.email),
          user: { id: user._id.toString(), username: user.username, role: user.role },
        },
      });
    }

    // ✅ LGU => token immediately
    const token = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        role: "LGU",
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          lguName: user.lguName,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
