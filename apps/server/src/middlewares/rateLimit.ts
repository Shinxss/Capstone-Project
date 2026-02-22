import rateLimit from "express-rate-limit";
import { AUDIT_EVENT } from "../features/audit/audit.constants";
import { logSecurityEvent } from "../features/audit/audit.service";

const RATE_LIMIT_MESSAGE = {
  success: false,
  error: "Too many requests, please try again later.",
};

function createLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
    handler: (req, res) => {
      void logSecurityEvent(req, AUDIT_EVENT.SECURITY_RATE_LIMIT_HIT, "DENY", {
        max,
        windowMs,
        path: req.originalUrl,
        method: req.method,
      });

      res.status(429).json(RATE_LIMIT_MESSAGE);
    },
  });
}

export const loginLimiter = createLimiter(15 * 60 * 1000, 10);
export const otpLimiter = createLimiter(10 * 60 * 1000, 5);
export const passwordLimiter = createLimiter(10 * 60 * 1000, 5);
export const registerLimiter = createLimiter(15 * 60 * 1000, 10);
export const guestEmergencyReportLimiter = createLimiter(5 * 60 * 1000, 5);
