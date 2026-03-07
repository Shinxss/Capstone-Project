import { Schema, model, models } from "mongoose";

export type ProfileSkillDoc = {
  code: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const ProfileSkillSchema = new Schema<ProfileSkillDoc>(
  {
    code: { type: String, required: true, trim: true, maxlength: 80, unique: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 120, unique: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, min: 0 },
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

ProfileSkillSchema.index({ isActive: 1, sortOrder: 1, label: 1 });

export const ProfileSkill = models.ProfileSkill || model<ProfileSkillDoc>("ProfileSkill", ProfileSkillSchema);
