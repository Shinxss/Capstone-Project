import type { CookieOptions, Request, Response } from "express";

const MOBILE_PLATFORM_HEADER = "x-client-platform";
const MOBILE_PLATFORM_VALUE = "mobile";
const DEFAULT_ACCESS_COOKIE_NAME = "accessToken";
const LEGACY_ACCESS_COOKIE_NAMES = ["accessToken", "token"] as const;

function normalizeHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "").trim().toLowerCase();
  return String(value ?? "").trim().toLowerCase();
}

function parseBooleanEnv(value: string | undefined): boolean | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function resolveAccessCookieName() {
  const fromEnv = String(process.env.AUTH_ACCESS_COOKIE_NAME ?? "").trim();
  return fromEnv || DEFAULT_ACCESS_COOKIE_NAME;
}

function resolveCookieSecure() {
  const envOverride = parseBooleanEnv(process.env.AUTH_COOKIE_SECURE);
  if (envOverride !== null) return envOverride;
  return process.env.NODE_ENV === "production";
}

function resolveCookieSameSite(secure: boolean): CookieOptions["sameSite"] {
  const raw = String(process.env.AUTH_COOKIE_SAME_SITE ?? "").trim().toLowerCase();
  if (raw === "strict") return "strict";
  if (raw === "none" && secure) return "none";
  return "lax";
}

function resolveCookieDomain() {
  const domain = String(process.env.AUTH_COOKIE_DOMAIN ?? "").trim();
  return domain || undefined;
}

function buildCookieOptions(): CookieOptions {
  const secure = resolveCookieSecure();
  const sameSite = resolveCookieSameSite(secure);
  const domain = resolveCookieDomain();

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

function parseCookieHeader(cookieHeader: string | undefined | null) {
  const raw = String(cookieHeader ?? "").trim();
  if (!raw) return {} as Record<string, string>;

  const parsed: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const [nameRaw, ...valueParts] = part.split("=");
    const name = String(nameRaw ?? "").trim();
    if (!name) continue;
    const encodedValue = valueParts.join("=").trim();
    if (!encodedValue) continue;

    try {
      parsed[name] = decodeURIComponent(encodedValue);
    } catch {
      parsed[name] = encodedValue;
    }
  }

  return parsed;
}

function candidateCookieNames() {
  const preferred = resolveAccessCookieName();
  return Array.from(new Set([preferred, ...LEGACY_ACCESS_COOKIE_NAMES]));
}

export function isMobileClient(req: Pick<Request, "headers">) {
  const platform = normalizeHeaderValue(req.headers[MOBILE_PLATFORM_HEADER]);
  return platform === MOBILE_PLATFORM_VALUE;
}

export function shouldIncludeAccessTokenInBody(req: Request) {
  if (isMobileClient(req)) return true;

  const origin = String(req.headers.origin ?? "").trim();
  const referer = String(req.headers.referer ?? "").trim();
  const isBrowserRequest = Boolean(origin || referer);
  return !isBrowserRequest;
}

export function setAccessTokenCookie(res: Response, token: string) {
  res.cookie(resolveAccessCookieName(), token, buildCookieOptions());
}

export function clearAccessTokenCookie(res: Response) {
  const options = buildCookieOptions();
  for (const cookieName of candidateCookieNames()) {
    res.clearCookie(cookieName, options);
  }
}

export function readAccessTokenFromCookieHeader(cookieHeader: string | undefined | null) {
  const parsed = parseCookieHeader(cookieHeader);
  for (const cookieName of candidateCookieNames()) {
    const token = String(parsed[cookieName] ?? "").trim();
    if (token) return token;
  }
  return "";
}

export function readAccessTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const cookies = (req.cookies ?? {}) as Record<string, unknown>;
  for (const cookieName of candidateCookieNames()) {
    const cookieToken = String(cookies[cookieName] ?? "").trim();
    if (cookieToken) return cookieToken;
  }

  return readAccessTokenFromCookieHeader(req.headers.cookie);
}
