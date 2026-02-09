import { Schema, model, Types } from "mongoose";

export type HazardType = "FLOODED" | "ROAD_CLOSED" | "FIRE_RISK" | "LANDSLIDE" | "UNSAFE";

export type GeoJSONPolygon = {
  type: "Polygon" | "MultiPolygon";
  coordinates: any;
};

export interface IHazardZone {
  name: string;
  hazardType: HazardType;
  geometry: GeoJSONPolygon;
  createdBy?: Types.ObjectId;
}

const hazardZoneSchema = new Schema<IHazardZone>(
  {
    name: { type: String, required: true, index: true },
    hazardType: {
      type: String,
      required: true,
      enum: ["FLOODED", "ROAD_CLOSED", "FIRE_RISK", "LANDSLIDE", "UNSAFE"],
    },

    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true,
      },
      coordinates: { type: Array, required: true },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

// geo queries need this
hazardZoneSchema.index({ geometry: "2dsphere" });

export const HazardZone = model<IHazardZone>("HazardZone", hazardZoneSchema);
