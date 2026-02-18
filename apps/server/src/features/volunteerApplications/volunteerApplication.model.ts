import { Schema, model, models, Types } from "mongoose";

export type VolunteerApplicationStatus =
  | "pending_verification"
  | "needs_info"
  | "verified"
  | "rejected";

export type Sex = "Male" | "Female" | "Prefer not to say";

export type VolunteerApplicationDoc = {
  userId: Types.ObjectId;

  fullName: string;
  sex: Sex;
  birthdate: string; // YYYY-MM-DD

  mobile: string;
  email?: string;

  street?: string;
  barangay: string;
  city?: string;
  province?: string;

  emergencyContact: {
    name: string;
    relationship: string;
    mobile: string;
    addressSameAsApplicant?: boolean;
    address?: string;
  };

  skillsOther?: string;
  certificationsText?: string;
  availabilityText?: string;
  preferredAssignmentText?: string;
  healthNotes?: string;

  consent: {
    truth: boolean;
    rules: boolean;
    data: boolean;
  };

  status: VolunteerApplicationStatus;

  reviewedBy?: Types.ObjectId; // LGU/Admin
  reviewedAt?: Date;
  reviewNotes?: string;
};

const EmergencyContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    addressSameAsApplicant: { type: Boolean, default: true },
    address: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const ConsentSchema = new Schema(
  {
    truth: { type: Boolean, required: true },
    rules: { type: Boolean, required: true },
    data: { type: Boolean, required: true },
  },
  { _id: false }
);

const VolunteerApplicationSchema = new Schema<VolunteerApplicationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    sex: { type: String, required: true, enum: ["Male", "Female", "Prefer not to say"] },
    birthdate: { type: String, required: true, trim: true, maxlength: 10 },

    mobile: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },

    street: { type: String, default: "", trim: true, maxlength: 300 },
    barangay: { type: String, required: true, trim: true, index: true, maxlength: 200 },
    city: { type: String, default: "", trim: true, maxlength: 200 },
    province: { type: String, default: "", trim: true, maxlength: 200 },

    emergencyContact: { type: EmergencyContactSchema, required: true },

    skillsOther: { type: String, default: "", trim: true },
    certificationsText: { type: String, default: "", trim: true },
    availabilityText: { type: String, default: "", trim: true },
    preferredAssignmentText: { type: String, default: "", trim: true },
    healthNotes: { type: String, default: "", trim: true },

    consent: { type: ConsentSchema, required: true },

    status: {
      type: String,
      required: true,
      default: "pending_verification",
      enum: ["pending_verification", "needs_info", "verified", "rejected"],
      index: true,
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, default: "", trim: true },
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

export const VolunteerApplication =
  models.VolunteerApplication ||
  model<VolunteerApplicationDoc>("VolunteerApplication", VolunteerApplicationSchema);
