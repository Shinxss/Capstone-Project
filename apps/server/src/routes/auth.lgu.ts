import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signAccessToken } from "../utils/jwt";

export const lguAuthRouter = Router();

/**
 * POST /api/auth/lgu/login
 * body: { username, password }
 */
lguAuthRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "username and password are required" });
    }

    const user = await User.findOne({ username, role: "LGU" }).lean();
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Account is disabled" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const secret = process.env.JWT_ACCESS_SECRET || "";
    if (!secret) {
      return res.status(500).json({ success: false, error: "Missing JWT_ACCESS_SECRET" });
    }

    const token = signAccessToken({ sub: user._id.toString(), role: user.role }, secret);

    return res.json({
      success: true,
      data: {
        accessToken: token,
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
