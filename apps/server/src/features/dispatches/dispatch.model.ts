import { Schema, model, models, Types } from "mongoose";

export type DispatchStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "DONE"
  | "VERIFIED";

export type EmergencySnapshot = {
  id: string;
  emergencyType: string;
  source: string;
  status: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  notes?: string;
  reportedAt: Date;
  barangayName?: string | null;
};

export type DispatchProof = {
  url: string;
  uploadedAt: Date;
  mimeType?: string;
  fileName?: string;
};

export type DispatchOfferDoc = {
  emergencyId: Types.ObjectId;
  volunteerId: Types.ObjectId;
  createdBy: Types.ObjectId;

  status: DispatchStatus;
  respondedAt?: Date;

  // Volunteer completion
  completedAt?: Date;
  proofs?: DispatchProof[];

  // LGU verification
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;

  // Blockchain audit trail (hash-only)
  chainRecord?: {
    network: string;
    contractAddress: string;
    txHash: string;
    blockNumber?: number;
    taskIdHash: string;
    payloadHash: string;
    recordedAt: Date;
  };

  emergencySnapshot: EmergencySnapshot;

  createdAt: Date;
  updatedAt: Date;
};

const DispatchOfferSchema = new Schema<DispatchOfferDoc>(
  {
    emergencyId: { type: Schema.Types.ObjectId, ref: "EmergencyReport", required: true, index: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "DONE", "VERIFIED"],
      default: "PENDING",
      index: true,
    },

    respondedAt: { type: Date },

    completedAt: { type: Date },
    proofs: {
      type: [
        {
          url: { type: String, required: true },
          uploadedAt: { type: Date, required: true },
          mimeType: { type: String },
          fileName: { type: String },
        },
      ],
      default: [],
    },

    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },

    chainRecord: {
      network: { type: String },
      contractAddress: { type: String },
      txHash: { type: String },
      blockNumber: { type: Number },
      taskIdHash: { type: String },
      payloadHash: { type: String },
      recordedAt: { type: Date },
    },

    emergencySnapshot: {
      id: { type: String, required: true },
      emergencyType: { type: String, required: true },
      source: { type: String, required: true },
      status: { type: String, required: true },
      location: {
        type: { type: String, enum: ["Point"], required: true, default: "Point" },
        coordinates: {
          type: [Number],
          required: true,
          validate: {
            validator: (arr: number[]) => Array.isArray(arr) && arr.length === 2,
            message: "emergencySnapshot.location.coordinates must be [lng, lat]",
          },
        },
      },
      notes: { type: String },
      reportedAt: { type: Date, required: true },
      barangayName: { type: String, default: null },
    },
  },
  { timestamps: true }
);

DispatchOfferSchema.index({ volunteerId: 1, status: 1, updatedAt: -1 });
DispatchOfferSchema.index({ emergencyId: 1, status: 1, updatedAt: -1 });

export const DispatchOffer =
  models.DispatchOffer || model<DispatchOfferDoc>("DispatchOffer", DispatchOfferSchema);
