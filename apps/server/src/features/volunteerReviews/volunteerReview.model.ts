import { Schema, model, models, Types } from "mongoose";

export type VolunteerReviewDoc = {
  emergencyId: Types.ObjectId;
  dispatchOfferId: Types.ObjectId;
  volunteerId: Types.ObjectId;
  reviewerUserId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
};

const volunteerReviewSchema = new Schema<VolunteerReviewDoc>(
  {
    emergencyId: { type: Schema.Types.ObjectId, ref: "EmergencyReport", required: true, index: true },
    dispatchOfferId: { type: Schema.Types.ObjectId, ref: "DispatchOffer", required: true, index: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reviewerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
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

volunteerReviewSchema.index(
  { emergencyId: 1, reviewerUserId: 1 },
  { unique: true, name: "uniq_emergency_reviewer_review" }
);
volunteerReviewSchema.index({ volunteerId: 1, createdAt: -1 });
volunteerReviewSchema.index({ reviewerUserId: 1, createdAt: -1 });

export const VolunteerReview =
  models.VolunteerReview || model<VolunteerReviewDoc>("VolunteerReview", volunteerReviewSchema);
