import mongoose, { Schema, Types } from "mongoose";

export type GeoJSONPolygon = {
  type: "Polygon" | "MultiPolygon";
  coordinates: any;
};

export type BarangayDoc = {
  _id: Types.ObjectId;
  name: string;
  city: string;
  province: string;
  code?: string;
  geometry: GeoJSONPolygon;
  rawProperties?: Record<string, any>;
};

const BarangaySchema = new Schema<BarangayDoc>(
  {
    name: { type: String, required: true, index: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    code: { type: String },

    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true,
      },
      coordinates: { type: Array, required: true },
    },

    rawProperties: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ✅ geo queries need this
BarangaySchema.index({ geometry: "2dsphere" });

// Optional: unique per city/province
BarangaySchema.index({ name: 1, city: 1, province: 1 }, { unique: true });

export const BarangayModel = mongoose.model("Barangay", BarangaySchema);
