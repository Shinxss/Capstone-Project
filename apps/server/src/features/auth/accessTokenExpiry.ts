import type { Request } from "express";
import type { SignOptions } from "jsonwebtoken";

const MOBILE_PLATFORM_HEADER = "x-client-platform";
const MOBILE_PLATFORM_VALUE = "mobile";

const MOBILE_ACCESS_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_MOBILE_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

function normalizeHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "").trim().toLowerCase();
  return String(value ?? "").trim().toLowerCase();
}

export function resolveAccessTokenExpiresIn(req: Request): SignOptions["expiresIn"] | undefined {
  const platform = normalizeHeaderValue(req.headers[MOBILE_PLATFORM_HEADER]);
  if (platform === MOBILE_PLATFORM_VALUE) {
    return MOBILE_ACCESS_EXPIRES_IN;
  }
  return undefined;
}
