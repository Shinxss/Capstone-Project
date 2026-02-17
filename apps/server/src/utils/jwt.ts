import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { SignOptions, Secret } from "jsonwebtoken";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET ?? "dev_access_secret";
const ACCESS_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

export type AccessTokenPayload = {
  sub: string;
  role?: string;
};

export type VerifiedAccessTokenPayload = AccessTokenPayload & {
  jti: string;
  exp: number;
  iat?: number;
};

export function signAccessToken(payload: AccessTokenPayload) {
  const jti = crypto.randomUUID();
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN, jwtid: jti });
}

export function verifyAccessToken(token: string): VerifiedAccessTokenPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload & { jti?: string; exp?: number; iat?: number };
  if (!decoded.jti || typeof decoded.exp !== "number") {
    throw new Error("Invalid token payload");
  }

  return {
    sub: decoded.sub,
    role: decoded.role,
    jti: decoded.jti,
    exp: decoded.exp,
    iat: decoded.iat,
  };
}
