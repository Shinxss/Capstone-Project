import type { NextFunction, Request, Response } from "express";
import { TokenBlocklist } from "../features/auth/TokenBlocklist.model";
import { verifyAccessToken } from "../utils/jwt";

function readToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const cookieToken = req.cookies?.accessToken ?? req.cookies?.token;
  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
}

export async function maybeAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
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
