import { Schema, model, models } from "mongoose";

export type UserRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";
export type VolunteerStatus = "NONE" | "PENDING" | "APPROVED";

const UserSchema = new Schema(
  {
    // LGU uses username, Community uses email
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },

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

    // ✅ Community can apply to be volunteer later
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

export const User = models.User || model("User", UserSchema);
