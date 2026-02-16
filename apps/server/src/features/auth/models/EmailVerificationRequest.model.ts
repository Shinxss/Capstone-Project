import { Schema, model, models, type Types } from "mongoose";

export type EmailVerificationRequestDoc = {
  userId: Types.ObjectId;
  email: string;
  otpHash: string;
  otpExpiresAt: Date;
  verifiedAt?: Date;
  resendCount: number;
  lastSentAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

const EmailVerificationRequestSchema = new Schema<EmailVerificationRequestDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    verifiedAt: { type: Date },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

EmailVerificationRequestSchema.index({ email: 1, otpExpiresAt: 1 });
EmailVerificationRequestSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationRequest =
  models.EmailVerificationRequest ||
  model<EmailVerificationRequestDoc>("EmailVerificationRequest", EmailVerificationRequestSchema);
