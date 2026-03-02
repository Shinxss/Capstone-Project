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
  fileHash?: string;
};

export type DispatchBlockchainRecord = {
  network: string;
  contractAddress: string;
  schemaVersion: string;
  domain: string;
  taskIdHash: string;
  payloadHash: string;
  verifiedTxHash: string;
  verifiedAtBlockTime?: Date;
  verifierAddress?: string;
  revoked: boolean;
  revokedReasonHash?: string;
  revokedTxHash?: string;
  revokedAtBlockTime?: Date;
  reverifiedTxHash?: string;
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
  proofFileHashes?: string[];

  // LGU verification
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;

  // Latest volunteer location for community-side live tracking
  lastKnownLocation?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  lastKnownLocationAt?: Date;

  // Blockchain audit trail (hash-only)
  chainRecord?: {
    network: string;
    contractAddress: string;
    txHash: string;
    blockNumber?: number;
    taskIdHash: string;
    payloadHash: string;
    recordHash?: string;
    recordedAt: Date;
    revoked?: boolean;
  };
  blockchain?: DispatchBlockchainRecord;

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
          fileHash: { type: String },
        },
      ],
      default: [],
    },
    proofFileHashes: {
      type: [String],
      default: [],
    },

    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },

    lastKnownLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: function (
            this: { lastKnownLocation?: { type?: string } },
            arr: number[] | undefined
          ) {
            const locationType = this?.lastKnownLocation?.type;

            // Backward compatibility:
            // Older docs may carry an empty coordinates array with no location type.
            if (!locationType) {
              return !arr || (Array.isArray(arr) && arr.length === 0);
            }

            return Array.isArray(arr) && arr.length === 2;
          },
          message: "lastKnownLocation.coordinates must be [lng, lat]",
        },
      },
      accuracy: { type: Number },
      heading: { type: Number },
      speed: { type: Number },
    },
    lastKnownLocationAt: { type: Date },

    chainRecord: {
      network: { type: String },
      contractAddress: { type: String },
      txHash: { type: String },
      blockNumber: { type: Number },
      taskIdHash: { type: String },
      payloadHash: { type: String },
      recordHash: { type: String },
      recordedAt: { type: Date },
      revoked: { type: Boolean },
    },

    blockchain: {
      network: { type: String },
      contractAddress: { type: String },
      schemaVersion: { type: String },
      domain: { type: String },
      taskIdHash: { type: String },
      payloadHash: { type: String },
      verifiedTxHash: { type: String },
      verifiedAtBlockTime: { type: Date },
      verifierAddress: { type: String },
      revoked: { type: Boolean, default: false },
      revokedReasonHash: { type: String },
      revokedTxHash: { type: String },
      revokedAtBlockTime: { type: Date },
      reverifiedTxHash: { type: String },
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

DispatchOfferSchema.index({ volunteerId: 1, status: 1, updatedAt: -1 });
DispatchOfferSchema.index({ emergencyId: 1, status: 1, updatedAt: -1 });
DispatchOfferSchema.index({ "blockchain.taskIdHash": 1 });
DispatchOfferSchema.index({ emergencyId: 1, status: 1, lastKnownLocationAt: -1 });

export const DispatchOffer =
  models.DispatchOffer || model<DispatchOfferDoc>("DispatchOffer", DispatchOfferSchema);
