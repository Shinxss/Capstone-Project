import { Schema, model, models } from "mongoose";

export type ProfileAvatarAssetDoc = {
  filename: string;
  userId: string;
  mimeType: "image/png" | "image/jpeg" | "image/heic";
  payload: Buffer;
  createdAt: Date;
  updatedAt: Date;
};

const ProfileAvatarAssetSchema = new Schema<ProfileAvatarAssetDoc>(
  {
    filename: { type: String, required: true, trim: true, unique: true, index: true },
    userId: { type: String, required: true, trim: true, index: true },
    mimeType: { type: String, required: true, enum: ["image/png", "image/jpeg", "image/heic"] },
    payload: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

export const ProfileAvatarAsset =
  models.ProfileAvatarAsset ||
  model<ProfileAvatarAssetDoc>("ProfileAvatarAsset", ProfileAvatarAssetSchema);
