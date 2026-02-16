import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../../users/user.model";
import { PasswordResetRequest } from "../models/PasswordResetRequest.model";
import { sendPasswordResetOtpEmail } from "../../../utils/mailer";
import {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_VERIFY_ATTEMPTS,
  addMinutes,
  evaluateOtpResendRateLimit,
  generateResetToken,
  generateSixDigitOtp,
  sha256,
} from "../otp.utils";

const passwordResetRoutes = Router();

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email"),
});

const verifyPasswordOtpSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Invalid email"),
    resetToken: z.string().trim().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

async function sendPasswordResetOtp(userId: string, email: string) {
  const now = new Date();
  const latestRequest = await PasswordResetRequest.findOne({ email }).sort({ lastSentAt: -1 });
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

  await PasswordResetRequest.findOneAndUpdate(
    { email },
    {
      $set: {
        userId,
        email,
        otpHash,
        otpExpiresAt,
        verifiedAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        attempts: 0,
        lastSentAt: now,
        resendCount: rate.nextResendCount,
      },
    },
    { upsert: true, new: true }
  );

  await sendPasswordResetOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
  return { success: true as const };
}

passwordResetRoutes.post("/forgot", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.status(200).json({ success: true, message: "OTP sent" });
    }

    const sent = await sendPasswordResetOtp(user._id.toString(), email);
    if (!sent.success) {
      return res.status(sent.status).json({ success: false, error: sent.message });
    }

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("[auth.password] failed to request reset OTP", error);
    return res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});

passwordResetRoutes.post("/verify-otp", async (req, res) => {
  const parsed = verifyPasswordOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const email = parsed.data.email.toLowerCase();
  const otp = parsed.data.otp;

  try {
    const now = new Date();
    const request = await PasswordResetRequest.findOne({
      email,
      otpExpiresAt: { $gt: now },
    }).sort({ lastSentAt: -1 });

    if (!request || request.verifiedAt) {
      return res.status(400).json({ success: false, error: "OTP is invalid or expired" });
    }

    if (request.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      return res.status(400).json({ success: false, error: "Too many invalid OTP attempts" });
    }

    if (sha256(otp) !== request.otpHash) {
      request.attempts += 1;
      await request.save();
      return res.status(400).json({ success: false, error: "OTP is invalid or expired" });
    }

    const resetToken = generateResetToken();
    request.verifiedAt = now;
    request.resetTokenHash = sha256(resetToken);
    request.resetTokenExpiresAt = addMinutes(now, OTP_EXPIRY_MINUTES);
    await request.save();

    return res.status(200).json({ success: true, resetToken });
  } catch (error) {
    console.error("[auth.password] failed to verify reset OTP", error);
    return res.status(500).json({ success: false, error: "Failed to verify OTP" });
  }
});

passwordResetRoutes.post("/reset", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  const email = parsed.data.email.toLowerCase();
  const tokenHash = sha256(parsed.data.resetToken);

  try {
    const now = new Date();
    const request = await PasswordResetRequest.findOne({
      email,
      resetTokenHash: { $exists: true, $ne: null },
      resetTokenExpiresAt: { $gt: now },
    }).sort({ lastSentAt: -1 });

    if (!request?.resetTokenHash || request.resetTokenHash !== tokenHash) {
      return res.status(400).json({ success: false, error: "Reset token is invalid or expired" });
    }

    const user = await User.findById(request.userId);
    if (!user || user.email?.toLowerCase() !== email) {
      return res.status(400).json({ success: false, error: "Reset token is invalid or expired" });
    }

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    user.authProvider = user.googleSub ? "both" : "local";
    await user.save();

    await PasswordResetRequest.deleteMany({ email });

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("[auth.password] failed to reset password", error);
    return res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

export default passwordResetRoutes;
