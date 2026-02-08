import { Schema, model, Types } from "mongoose";

export type EmergencyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
export type EmergencySource = "SOS_BUTTON" | "REPORT_FORM" | "SMS_OFFLINE";
export type EmergencyType = "SOS" | "FIRE" | "FLOOD" | "EARTHQUAKE" | "MEDICAL" | "OTHER";

export interface IEmergencyReport {
  emergencyType: EmergencyType;
  source: EmergencySource;
  status: EmergencyStatus;

  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    accuracy?: number;
  };

  notes?: string;

  reportedBy: Types.ObjectId;
  reportedAt: Date;
}

const emergencyReportSchema = new Schema<IEmergencyReport>(
  {
    emergencyType: { type: String, required: true, default: "SOS" },
    source: { type: String, required: true, default: "SOS_BUTTON" },
    status: { type: String, required: true, default: "OPEN" },

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

    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Geo index for near queries later
emergencyReportSchema.index({ location: "2dsphere" });

export const EmergencyReport = model<IEmergencyReport>("EmergencyReport", emergencyReportSchema);
