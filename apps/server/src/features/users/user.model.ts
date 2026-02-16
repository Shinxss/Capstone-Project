import { Schema, model, models } from "mongoose";

export type UserRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";
export type VolunteerStatus = "NONE" | "PENDING" | "APPROVED";
export type AuthProvider = "local" | "google" | "both";

export type UserDoc = {
  username?: string;
  email?: string;

  firstName: string;
  lastName: string;

  passwordHash?: string;
  googleSub?: string;
  authProvider?: AuthProvider;
  emailVerified: boolean;

  role: UserRole;

  lguName?: string;
  lguPosition?: string;
  barangay?: string;
  municipality?: string;

  volunteerStatus: VolunteerStatus;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    username: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },

    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },

    passwordHash: { type: String, default: "" },
    googleSub: { type: String, default: "", trim: true },
    authProvider: { type: String, enum: ["local", "google", "both"], default: "local" },
    emailVerified: { type: Boolean, default: false, index: true },

    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "LGU", "VOLUNTEER", "COMMUNITY"],
      index: true,
    },

    lguName: { type: String, default: "", trim: true },
    lguPosition: { type: String, default: "", trim: true },
    barangay: { type: String, default: "", trim: true },
    municipality: { type: String, default: "", trim: true },

    volunteerStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED"],
      default: "NONE",
      index: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: { username: { $type: "string", $ne: "" } },
  }
);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $ne: "" } },
  }
);

UserSchema.index(
  { googleSub: 1 },
  {
    unique: true,
    partialFilterExpression: { googleSub: { $type: "string", $ne: "" } },
  }
);

export const User = models.User || model<UserDoc>("User", UserSchema);
