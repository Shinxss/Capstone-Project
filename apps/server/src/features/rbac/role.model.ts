import { Schema, model, models } from "mongoose";

export const ROLE_PROFILE_KEYS = ["SUPER_ADMIN", "CDRRMO_ADMIN", "LGU_ADMIN"] as const;
export type RoleProfileKey = (typeof ROLE_PROFILE_KEYS)[number];

export type RoleProfileDoc = {
  key: RoleProfileKey;
  label: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

const RoleProfileSchema = new Schema<RoleProfileDoc>(
  {
    key: {
      type: String,
      enum: ROLE_PROFILE_KEYS,
      required: true,
      unique: true,
      index: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    permissions: { type: [String], default: [] },
  },
  {
    strict: "throw",
    timestamps: true,
    versionKey: false,
  }
);

export const RoleProfile =
  models.RoleProfile || model<RoleProfileDoc>("RoleProfile", RoleProfileSchema, "role_profiles");
