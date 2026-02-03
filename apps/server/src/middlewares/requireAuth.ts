import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    // ✅ set both styles so all routes work
    (req as any).userId = payload.sub;
    (req as any).role = payload.role;

    // ✅ add req.user for controllers that expect it
    (req as any).user = { id: payload.sub, role: payload.role };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
