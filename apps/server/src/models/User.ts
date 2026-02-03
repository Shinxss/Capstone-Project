import { Schema, model, models } from "mongoose";

export type UserRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";
export type VolunteerStatus = "NONE" | "PENDING" | "APPROVED";

export type UserDoc = {
  username?: string; // LGU / Admin can use this
  email?: string; // Community uses this

  // ✅ Used by all roles (including LGU)
  firstName: string;
  lastName: string;

  passwordHash: string;

  role: UserRole;

  // ✅ LGU-only fields
  lguName?: string;
  lguPosition?: string; // ✅ NEW (e.g., "MDRRMO Officer", "Barangay Captain")
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
    username: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },

    // ✅ Names (LGU included)
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "LGU", "VOLUNTEER", "COMMUNITY"],
      index: true,
    },

    // ✅ Optional LGU fields
    lguName: { type: String, default: "", trim: true },
    lguPosition: { type: String, default: "", trim: true }, // ✅ NEW
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

export const User = models.User || model<UserDoc>("User", UserSchema);
