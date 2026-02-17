import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../../users/user.model";
import { EmailVerificationRequest } from "../models/EmailVerificationRequest.model";
import { sendSignupVerificationOtpEmail } from "../../../utils/mailer";
import { signAccessToken } from "../../../utils/jwt";
import { communityRegisterSchema } from "../auth.schemas";
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

async function sendSignupOtpForUser(userId: string, email: string) {
  const now = new Date();
  const latestRequest = await EmailVerificationRequest.findOne({ email }).sort({ lastSentAt: -1 });
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

  await sendSignupVerificationOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
  return { success: true as const };
}

signupOtpRoutes.post("/", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const { firstName, lastName, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  try {
    let user = await User.findOne({ email });

    if (user?.emailVerified) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (!user) {
      user = await User.create({
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        authProvider: "local",
        emailVerified: false,
        role: "COMMUNITY",
        volunteerStatus: "NONE",
        isActive: true,
      });
    } else {
      user.firstName = firstName.trim();
      user.lastName = lastName.trim();
      user.passwordHash = passwordHash;
      user.emailVerified = false;
      user.authProvider = user.googleSub ? "both" : "local";
      await user.save();
    }

    const sent = await sendSignupOtpForUser(user._id.toString(), email);
    if (!sent.success) {
      return res.status(sent.status).json({ success: false, error: sent.message });
    }

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("[auth.signup] failed to request OTP", error);
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
    await user.save();

    await EmailVerificationRequest.deleteMany({ email });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: toAuthUserPayload(user),
      },
    });
  } catch (error) {
    console.error("[auth.signup] failed to verify OTP", error);
    return res.status(500).json({ success: false, error: "Failed to verify OTP" });
  }
});

signupOtpRoutes.post("/resend-otp", async (req, res) => {
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

    const sent = await sendSignupOtpForUser(user._id.toString(), email);
    if (!sent.success) {
      return res.status(sent.status).json({ success: false, error: sent.message });
    }

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("[auth.signup] failed to resend OTP", error);
    return res.status(500).json({ success: false, error: "Failed to resend OTP" });
  }
});

export default signupOtpRoutes;
