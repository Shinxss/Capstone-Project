import rateLimit from "express-rate-limit";

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
  });
}

export const loginLimiter = createLimiter(15 * 60 * 1000, 10);
export const otpLimiter = createLimiter(10 * 60 * 1000, 5);
export const passwordLimiter = createLimiter(10 * 60 * 1000, 5);
export const registerLimiter = createLimiter(15 * 60 * 1000, 10);
