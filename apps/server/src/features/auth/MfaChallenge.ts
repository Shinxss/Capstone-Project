import { Schema, model, models, Types } from "mongoose";

export type MfaChallengeDoc = {
  userId: Types.ObjectId;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
};

const MfaChallengeSchema = new Schema<MfaChallengeDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ✅ Auto-delete when expired
MfaChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MfaChallenge =
  models.MfaChallenge || model<MfaChallengeDoc>("MfaChallenge", MfaChallengeSchema);
