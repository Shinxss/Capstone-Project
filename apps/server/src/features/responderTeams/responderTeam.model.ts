import { Schema, Types, model, models } from "mongoose";

export type ResponderTeamDoc = {
  name: string;
  code?: string;
  description?: string;
  barangay: string;
  municipality: string;
  leaderId?: Types.ObjectId;
  memberIds: Types.ObjectId[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ResponderTeamSchema = new Schema<ResponderTeamDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, default: "", trim: true, maxlength: 40 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    barangay: { type: String, required: true, trim: true, maxlength: 200, index: true },
    municipality: { type: String, required: true, trim: true, maxlength: 200, default: "Dagupan City" },
    leaderId: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    memberIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
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

ResponderTeamSchema.index(
  { barangay: 1, municipality: 1, name: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);
ResponderTeamSchema.index({ memberIds: 1, isActive: 1 });

export const ResponderTeam =
  models.ResponderTeam || model<ResponderTeamDoc>("ResponderTeam", ResponderTeamSchema);
