import { Schema, model, models } from "mongoose";

export type UserRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";
export type VolunteerStatus = "NONE" | "PENDING" | "APPROVED";

export type UserDoc = {
  username?: string; // LGU / Admin can use this
  email?: string; // Community uses this

  firstName: string;
  lastName: string;

  passwordHash: string;

  role: UserRole;

  lguName?: string;
  barangay?: string;
  municipality?: string;

  volunteerStatus: VolunteerStatus;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDoc>(
  {
    // LGU uses username, Community uses email
    // NOTE: do NOT use `unique: true` here. We'll define robust indexes below.
    username: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },

    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "LGU", "VOLUNTEER", "COMMUNITY"],
      index: true,
    },

    // Optional LGU fields
    lguName: { type: String, default: "" },
    barangay: { type: String, default: "" },
    municipality: { type: String, default: "" },

    // Community can apply to be volunteer later
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

export const User = models.User || model<UserDoc>("User", UserSchema);
