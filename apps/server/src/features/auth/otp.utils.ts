import crypto from "crypto";

export const OTP_DIGITS = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_COOLDOWN_SECONDS = 30;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateSixDigitOtp() {
  const value = crypto.randomInt(0, 1_000_000);
  return String(value).padStart(OTP_DIGITS, "0");
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

type RateLimitInput = {
  lastSentAt?: Date | null;
  resendCount?: number;
  now?: Date;
};

type RateLimitResult = {
  allowed: boolean;
  nextResendCount: number;
  errorMessage?: string;
};

export function evaluateOtpResendRateLimit(input: RateLimitInput): RateLimitResult {
  const now = input.now ?? new Date();
  const lastSentAt = input.lastSentAt ?? null;
  const existingResendCount = Math.max(0, input.resendCount ?? 0);

  if (lastSentAt) {
    const secondsSinceLastSend = (now.getTime() - lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < OTP_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLastSend);
      return {
        allowed: false,
        nextResendCount: existingResendCount,
        errorMessage: `Please wait ${waitSeconds}s before requesting another OTP.`,
      };
    }
  }

  const oneHourAgo = now.getTime() - 60 * 60_000;
  const isSameWindow = lastSentAt ? lastSentAt.getTime() >= oneHourAgo : false;
  const sendsInWindow = isSameWindow ? existingResendCount : 0;

  if (sendsInWindow >= OTP_MAX_SENDS_PER_HOUR) {
    return {
      allowed: false,
      nextResendCount: sendsInWindow,
      errorMessage: "Too many OTP requests. Please try again later.",
    };
  }

  return { allowed: true, nextResendCount: sendsInWindow + 1 };
}

type UserLike = {
  _id: { toString(): string } | string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  adminTier?: string;
  lguName?: string;
  lguPosition?: string;
  barangay?: string;
  municipality?: string;
  volunteerStatus?: string;
  authProvider?: string;
  passwordHash?: string;
  googleSub?: string;
  emailVerified?: boolean;
};

export function toAuthUserPayload(user: UserLike) {
  return {
    id: typeof user._id === "string" ? user._id : user._id.toString(),
    username: user.username ?? "",
    email: user.email ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    role: user.role ?? "",
    adminTier: user.adminTier ?? undefined,
    lguName: user.lguName ?? "",
    lguPosition: user.lguPosition ?? "",
    barangay: user.barangay ?? "",
    municipality: user.municipality ?? "",
    volunteerStatus: user.volunteerStatus ?? "",
    authProvider: user.authProvider ?? "local",
    emailVerified: Boolean(user.emailVerified),
    passwordSet: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleSub),
  };
}
