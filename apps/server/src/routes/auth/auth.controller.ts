import { Request, Response } from "express";
import { authenticateUser } from "./auth.service";
import { signAccessToken } from "../../utils/jwt";
import { User } from "../../models/User";
import { verifyMfaChallenge } from "../../utils/mfa";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: "Login failed." });
  }
}

// ✅ NEW: Verify admin OTP and issue JWT
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

// Optional but useful: GET /auth/me to fetch profile
export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("firstName lastName email role");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch profile." });
  }
}
