import { Schema, Types, model, models } from "mongoose";

export type PushPlatform = "android" | "ios";

export type PushTokenDoc = {
  userId: Types.ObjectId;
  expoPushToken: string;
  platform: PushPlatform;
  isActive: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const PushTokenSchema = new Schema<PushTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expoPushToken: { type: String, required: true, trim: true },
    platform: { type: String, enum: ["android", "ios"], required: true },
    isActive: { type: Boolean, default: true, index: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

PushTokenSchema.index({ userId: 1, expoPushToken: 1 }, { unique: true });

export const PushToken = models.PushToken || model<PushTokenDoc>("PushToken", PushTokenSchema);
