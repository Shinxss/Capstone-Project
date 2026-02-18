import { Schema, model, models, type Types } from "mongoose";

export type TokenBlocklistDoc = {
  jti: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  reason?: string;
  createdAt: Date;
};

const TokenBlocklistSchema = new Schema<TokenBlocklistDoc>(
  {
    jti: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

TokenBlocklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlocklist =
  models.TokenBlocklist || model<TokenBlocklistDoc>("TokenBlocklist", TokenBlocklistSchema);
