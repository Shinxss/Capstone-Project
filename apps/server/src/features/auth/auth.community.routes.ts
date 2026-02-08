import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../users/user.model";
import { signAccessToken } from "../../utils/jwt";

export const communityAuthRouter = Router();

/**
 * POST /api/auth/community/register
 * body: { firstName, lastName, email, password }
 */
communityAuthRouter.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

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

/**
 * POST /api/auth/community/login
 * body: { email, password }
 * ✅ also allows VOLUNTEER role later using same account
 */
communityAuthRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      role: { $in: ["COMMUNITY", "VOLUNTEER"] },
    });

    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ success: false, error: "Account disabled" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const secret = process.env.JWT_ACCESS_SECRET || "";
    if (!secret) return res.status(500).json({ success: false, error: "Missing JWT_ACCESS_SECRET" });

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          volunteerStatus: user.volunteerStatus,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
