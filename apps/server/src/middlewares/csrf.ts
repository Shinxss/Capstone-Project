import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";

const isProduction = process.env.NODE_ENV === "production";

const CSRF_SECRET = process.env.CSRF_SECRET || "lifeline-csrf-dev-secret";

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

/**
 * Determine whether a request comes from a browser (has Origin or Referer
 * matching an allowed web origin). Mobile clients typically omit both headers.
 */
function isBrowserOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) return false; // mobile / server-to-server

  if (origin && allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }

  if (referer && allowedOrigins.length > 0) {
    try {
      const refOrigin = new URL(referer).origin;
      return allowedOrigins.includes(refOrigin);
    } catch {
      return false;
    }
  }

  // If no allowed origins configured, treat any Origin as browser
  return Boolean(origin || referer);
}

export const {
  generateCsrfToken,
  doubleCsrfProtection,
  validateRequest,
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: () => "",   // Stateless – no server-side sessions
  cookieName: "csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
  },
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) =>
    (req.headers["x-csrf-token"] as string) ?? null,
  errorConfig: {
    statusCode: 403,
    message: "CSRF token validation failed",
    code: "CSRF_INVALID",
  },
  /**
   * Skip CSRF enforcement for non-browser requests (e.g. mobile apps).
   * Mobile clients don't send Origin/Referer headers, so they bypass CSRF
   * while still authenticating via Bearer tokens.
   */
  skipCsrfProtection: (req) => !isBrowserOrigin(req),
});
