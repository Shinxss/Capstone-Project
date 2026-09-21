import { Schema, model, models } from "mongoose";

export type DispatchProofAssetDoc = {
  filename: string;
  dispatchId: string;
  mimeType: "image/png" | "image/jpeg" | "image/heic";
  payload: Buffer;
  createdAt: Date;
  updatedAt: Date;
};

const DispatchProofAssetSchema = new Schema<DispatchProofAssetDoc>(
  {
    filename: { type: String, required: true, trim: true, unique: true, index: true },
    dispatchId: { type: String, required: true, trim: true, index: true },
    mimeType: { type: String, required: true, enum: ["image/png", "image/jpeg", "image/heic"] },
    payload: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

export const DispatchProofAsset =
  models.DispatchProofAsset ||
  model<DispatchProofAssetDoc>("DispatchProofAsset", DispatchProofAssetSchema);
