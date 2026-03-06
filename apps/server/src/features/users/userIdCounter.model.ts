import { Schema, model, models } from "mongoose";

export type UserIdCounterDoc = {
  scope: string;
  year: number;
  seq: number;
  createdAt: Date;
  updatedAt: Date;
};

const UserIdCounterSchema = new Schema<UserIdCounterDoc>(
  {
    scope: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1970, max: 9999 },
    seq: { type: Number, required: true, min: 0, default: 0 },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

UserIdCounterSchema.index({ scope: 1, year: 1 }, { unique: true });

export const UserIdCounter =
  models.UserIdCounter || model<UserIdCounterDoc>("UserIdCounter", UserIdCounterSchema);
