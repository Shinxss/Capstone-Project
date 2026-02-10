import { Schema, model, Types } from "mongoose";

export type DispatchStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface IDispatchOffer {
  emergencyId: Types.ObjectId;
  volunteerId: Types.ObjectId;
  dispatchedBy: Types.ObjectId;
  status: DispatchStatus;
  dispatchedAt: Date;
  respondedAt?: Date;
}

const dispatchOfferSchema = new Schema<IDispatchOffer>(
  {
    emergencyId: { type: Schema.Types.ObjectId, ref: "EmergencyReport", required: true, index: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: { type: String, required: true, default: "PENDING" },
    dispatchedAt: { type: Date, required: true, default: Date.now },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate pending offers per emergency+volunteer
// Note: Allows multiple historical records once status is not PENDING.
dispatchOfferSchema.index(
  { emergencyId: 1, volunteerId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } }
);

dispatchOfferSchema.index({ volunteerId: 1, status: 1, dispatchedAt: -1 });

export const DispatchOffer = model<IDispatchOffer>("DispatchOffer", dispatchOfferSchema);
