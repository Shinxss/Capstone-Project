import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET ?? "dev_access_secret";

// process.env is `string | undefined`, so cast it into the correct expiresIn type
const ACCESS_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

export type AccessTokenPayload = {
  sub: string; // userId
  role?: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenPayload & JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload & JwtPayload;
}
