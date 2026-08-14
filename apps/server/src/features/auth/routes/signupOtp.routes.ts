import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../../users/user.model";
import { generateNextLifelineId } from "../../users/userId.service";
import { EmailVerificationRequest } from "../models/EmailVerificationRequest.model";
import { MailDeliveryError, sendSignupVerificationOtpEmail } from "../../../utils/mailer";
import { signAccessToken } from "../../../utils/jwt";
import { communityRegisterSchema } from "../auth.schemas";
import { setAccessTokenCookie, shouldIncludeAccessTokenInBody } from "../authCookie";
import { resolveAccessTokenExpiresIn } from "../accessTokenExpiry";
import {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_VERIFY_ATTEMPTS,
  addMinutes,
  evaluateOtpResendRateLimit,
  generateSixDigitOtp,
  sha256,
  toAuthUserPayload,
} from "../otp.utils";

const signupOtpRoutes = Router();

const signupSchema = communityRegisterSchema;

const verifySignupOtpSchema = z
  .object({
    email: z.string().trim().email("Invalid email"),
    otp: z.string().trim().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  })
  .strict();

const resendSignupOtpSchema = z
  .object({
    email: z.string().trim().email("Invalid email"),
  })
  .strict();

function createSignupRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function logSignupStage(requestId: string, stage: string, startedAt: number) {
  console.info(`[AUTH] signup ${requestId} ${stage} in ${Date.now() - startedAt}ms`);
}

function logSignupFailure(requestId: string, error: unknown, startedAt: number) {
  const code = String((error as { code?: unknown })?.code ?? "UNKNOWN");
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(`[AUTH] signup ${requestId} failed in ${Date.now() - startedAt}ms`, {
    name,
    code,
  });
}

async function sendSignupOtpForUser(userId: string, email: string, requestId: string) {
  const now = new Date();
  const lookupStartedAt = Date.now();
  const latestRequest = await EmailVerificationRequest.findOne({ email }).sort({ lastSentAt: -1 });
  logSignupStage(requestId, "OTP lookup completed", lookupStartedAt);
  const rate = evaluateOtpResendRateLimit({
    lastSentAt: latestRequest?.lastSentAt,
    resendCount: latestRequest?.resendCount,
    now,
  });

  if (!rate.allowed) {
    return { success: false as const, status: 429, message: rate.errorMessage };
  }

  const otp = generateSixDigitOtp();
  const otpHash = sha256(otp);
  const otpExpiresAt = addMinutes(now, OTP_EXPIRY_MINUTES);

  const otpStoreStartedAt = Date.now();
  await EmailVerificationRequest.findOneAndUpdate(
    { email },
    {
      $set: {
        userId,
        email,
        otpHash,
        otpExpiresAt,
        verifiedAt: null,
        attempts: 0,
        lastSentAt: now,
        resendCount: rate.nextResendCount,
      },
    },
    { upsert: true, new: true }
  );
  logSignupStage(requestId, "OTP generated and stored", otpStoreStartedAt);

  const emailStartedAt = Date.now();
  console.info(`[AUTH] signup ${requestId} email sending started`);
  try {
    await sendSignupVerificationOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
    logSignupStage(requestId, "email sending completed", emailStartedAt);
  } catch (error) {
    await EmailVerificationRequest.deleteOne({ email, otpHash, verifiedAt: null }).catch(() => undefined);
    throw error;
  }
  return { success: true as const };
}

signupOtpRoutes.post("/", async (req, res) => {
  const requestId = createSignupRequestId();
  const requestStartedAt = Date.now();
  console.info(`[AUTH] signup ${requestId} request received`);
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const { firstName, lastName, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  try {
    const userLookupStartedAt = Date.now();
    let user = await User.findOne({ email });
    logSignupStage(requestId, "user lookup completed", userLookupStartedAt);

    if (user?.emailVerified) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const hashStartedAt = Date.now();
    const passwordHash = await bcrypt.hash(password, 12);
    logSignupStage(requestId, "password hash completed", hashStartedAt);

    if (!user) {
      const userSaveStartedAt = Date.now();
      const lifelineId = await generateNextLifelineId();
      user = await User.create({
        email,
        lifelineId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        authProvider: "local",
        emailVerified: false,
        role: "COMMUNITY",
        volunteerStatus: "NONE",
        isActive: true,
      });
      logSignupStage(requestId, "user saved", userSaveStartedAt);
    } else {
      const userSaveStartedAt = Date.now();
      user.firstName = firstName.trim();
      user.lastName = lastName.trim();
      user.passwordHash = passwordHash;
      user.emailVerified = false;
      user.authProvider = user.googleSub ? "both" : "local";
      if (!user.lifelineId) {
        user.lifelineId = await generateNextLifelineId(user.createdAt);
      }
      await user.save();
      logSignupStage(requestId, "user saved", userSaveStartedAt);
    }

    const sent = await sendSignupOtpForUser(user._id.toString(), email, requestId);
    if (!sent.success) {
      return res.status(sent.status).json({ success: false, error: sent.message });
    }

    logSignupStage(requestId, "response returned", requestStartedAt);
    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    logSignupFailure(requestId, error, requestStartedAt);
    if (error instanceof MailDeliveryError) {
      return res.status(503).json({
        success: false,
        error: "We couldn't send the verification code. Please try again.",
      });
    }
    return res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});

signupOtpRoutes.post("/verify-otp", async (req, res) => {
  const parsed = verifySignupOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const email = parsed.data.email.toLowerCase();
  const otp = parsed.data.otp;

  try {
    const now = new Date();
    const request = await EmailVerificationRequest.findOne({
      email,
      otpExpiresAt: { $gt: now },
    }).sort({ lastSentAt: -1 });

    if (!request || request.verifiedAt) {
      return res.status(400).json({ success: false, error: "OTP is invalid or expired" });
    }

    if (request.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      return res.status(400).json({ success: false, error: "Too many invalid OTP attempts" });
    }

    const incomingHash = sha256(otp);
    if (incomingHash !== request.otpHash) {
      request.attempts += 1;
      await request.save();
      return res.status(400).json({ success: false, error: "OTP is invalid or expired" });
    }

    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    request.verifiedAt = now;
    await request.save();

    user.emailVerified = true;
    if (user.googleSub && user.passwordHash) user.authProvider = "both";
    else if (user.googleSub) user.authProvider = "google";
    else user.authProvider = "local";
    if (!user.lifelineId) {
      user.lifelineId = await generateNextLifelineId(user.createdAt);
    }
    await user.save();

    await EmailVerificationRequest.deleteMany({ email });

    const accessToken = signAccessToken(
      { sub: user._id.toString(), role: user.role },
      { expiresIn: resolveAccessTokenExpiresIn(req) }
    );
    setAccessTokenCookie(res, accessToken);

    return res.status(200).json({
      success: true,
      data: {
        ...(shouldIncludeAccessTokenInBody(req) ? { accessToken } : {}),
        user: toAuthUserPayload(user),
      },
    });
  } catch (error) {
    console.error("[auth.signup] failed to verify OTP", error);
    return res.status(500).json({ success: false, error: "Failed to verify OTP" });
  }
});

signupOtpRoutes.post("/resend-otp", async (req, res) => {
  const requestId = createSignupRequestId();
  const requestStartedAt = Date.now();
  const parsed = resendSignupOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const sent = await sendSignupOtpForUser(user._id.toString(), email, requestId);
    if (!sent.success) {
      return res.status(sent.status).json({ success: false, error: sent.message });
    }

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    logSignupFailure(requestId, error, requestStartedAt);
    if (error instanceof MailDeliveryError) {
      return res.status(503).json({
        success: false,
        error: "We couldn't send the verification code. Please try again.",
      });
    }
    return res.status(500).json({ success: false, error: "Failed to resend OTP" });
  }
});

export default signupOtpRoutes;
