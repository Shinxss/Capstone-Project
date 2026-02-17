import { Request, Response, NextFunction } from "express";
import { TokenBlocklist } from "../features/auth/TokenBlocklist.model";
import { verifyAccessToken } from "../utils/jwt";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    const revoked = await TokenBlocklist.findOne({ jti: payload.jti }).select("_id").lean();
    if (revoked) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.auth = payload;
    req.userId = payload.sub;
    req.role = payload.role;
    req.user = { id: payload.sub, role: payload.role ?? "" };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
