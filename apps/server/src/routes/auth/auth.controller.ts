import { Request, Response } from "express";
import { authenticateUser } from "./auth.service";
import { signAccessToken } from "../../utils/jwt";
import { User } from "../../models/User";

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
