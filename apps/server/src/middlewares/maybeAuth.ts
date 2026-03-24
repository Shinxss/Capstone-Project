import type { NextFunction, Request, Response } from "express";
import { readAccessTokenFromRequest } from "../features/auth/authCookie";
import { TokenBlocklist } from "../features/auth/TokenBlocklist.model";
import { verifyAccessToken } from "../utils/jwt";

export async function maybeAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessTokenFromRequest(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const revoked = await TokenBlocklist.findOne({ jti: payload.jti }).select("_id").lean();
    if (revoked) return next();

    req.auth = payload;
    req.userId = payload.sub;
    req.role = payload.role;
    req.user = { id: payload.sub, role: payload.role ?? "" };
  } catch {
    // ignore invalid token for optional-auth routes
  }

  return next();
}
