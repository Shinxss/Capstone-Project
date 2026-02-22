import { Schema, model, models, type Model, Types } from "mongoose";

export type EmergencyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
export type EmergencySource = "SOS_BUTTON" | "REPORT_FORM" | "SMS_OFFLINE";
export type EmergencyType =
  | "SOS"
  | "FIRE"
  | "FLOOD"
  | "TYPHOON"
  | "EARTHQUAKE"
  | "COLLAPSE"
  | "MEDICAL"
  | "OTHER";
export type VerificationStatus = "not_required" | "pending" | "approved" | "rejected";

export interface IEmergencyReport {
  isSos: boolean;
  emergencyType: EmergencyType;
  source: EmergencySource;
  status: EmergencyStatus;

  verification: {
    status: VerificationStatus;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    reason?: string;
  };

  visibility: {
    isVisibleOnMap: boolean;
  };

  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    accuracy?: number;
  };

  notes?: string;
  photos?: string[];
  locationLabel?: string;
  referenceNumber?: string;
  reporterIsGuest?: boolean;

  reportedBy?: Types.ObjectId;
  reportedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const emergencyReportSchema = new Schema<IEmergencyReport>(
  {
    isSos: { type: Boolean, required: true, default: false },
    emergencyType: { type: String, required: true, default: "SOS" },
    source: { type: String, required: true, default: "SOS_BUTTON" },
    status: { type: String, required: true, default: "OPEN" },

    verification: {
      status: {
        type: String,
        enum: ["not_required", "pending", "approved", "rejected"],
        required: true,
        default: "pending",
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
      reviewedAt: { type: Date, required: false },
      reason: { type: String, required: false },
    },

    visibility: {
      isVisibleOnMap: { type: Boolean, required: true, default: false },
    },

    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: (arr: number[]) => Array.isArray(arr) && arr.length === 2,
          message: "location.coordinates must be [lng, lat]",
        },
      },
      accuracy: { type: Number, required: false },
    },

    notes: { type: String },
    photos: { type: [String], default: [] },
    locationLabel: { type: String },
    referenceNumber: { type: String, unique: true, sparse: true },
    reporterIsGuest: { type: Boolean, default: false },

    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    reportedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

emergencyReportSchema.pre("validate", function normalizeVerificationAndVisibility() {
  if (this.isSos) {
    this.verification.status = "not_required";
    this.visibility.isVisibleOnMap = true;
  } else if (this.verification.status === "approved") {
    this.visibility.isVisibleOnMap = true;
  } else {
    this.visibility.isVisibleOnMap = false;
    if (this.verification.status === "not_required") {
      this.verification.status = "pending";
    }
  }
});

// Geo index for near queries later
emergencyReportSchema.index({ location: "2dsphere" });
emergencyReportSchema.index({ createdAt: -1 });
emergencyReportSchema.index({ isSos: 1, "verification.status": 1, "visibility.isVisibleOnMap": 1, createdAt: -1 });

type EmergencyReportModelType = Model<IEmergencyReport>;

export const EmergencyReport =
  (models.EmergencyReport as EmergencyReportModelType | undefined) ??
  model<IEmergencyReport>("EmergencyReport", emergencyReportSchema);
