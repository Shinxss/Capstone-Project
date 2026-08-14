import { Schema, model, models, Types } from "mongoose";
import { ACHIEVEMENT_IDS, type AchievementAwardMetadata, type AchievementId } from "./achievement.types";

export type UserAchievementDoc = {
  userId: Types.ObjectId;
  achievementId: AchievementId;
  unlockedAt: Date;
  metadata?: AchievementAwardMetadata;
  createdAt: Date;
  updatedAt: Date;
};

const achievementMetadataSchema = new Schema<AchievementAwardMetadata>(
  {
    verifiedTasks: { type: Number, min: 0 },
    reviewCount: { type: Number, min: 0 },
    averageRating: { type: Number, min: 0, max: 5 },
  },
  { _id: false, strict: "throw" }
);

const userAchievementSchema = new Schema<UserAchievementDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementId: {
      type: String,
      enum: ACHIEVEMENT_IDS,
      required: true,
    },
    unlockedAt: { type: Date, required: true },
    metadata: { type: achievementMetadataSchema, default: undefined },
  },
  {
    strict: "throw",
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

userAchievementSchema.index(
  { userId: 1, achievementId: 1 },
  { unique: true, name: "uniq_user_achievement" }
);
userAchievementSchema.index({ userId: 1, unlockedAt: -1 });

export const UserAchievement =
  models.UserAchievement || model<UserAchievementDoc>("UserAchievement", userAchievementSchema);
