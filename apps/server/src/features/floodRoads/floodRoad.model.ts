import { Schema, model } from "mongoose";

export type GeoJSONLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

export interface IFloodRoad {
  geometry: GeoJSONLineString;
  csv_flood_depth_5yr?: number | null;
  csv_passable?: number | null;
  csv_routing_cost?: number | null;
  osm_id?: number | null;
  full_id?: string | null;
  osm_type?: string | null;
  highway?: string | null;
}

const floodRoadSchema = new Schema<IFloodRoad>(
  {
    geometry: {
      type: {
        type: String,
        enum: ["LineString"],
        required: true,
      },
      coordinates: {
        type: [[Number]],
        required: true,
      },
    },
    csv_flood_depth_5yr: { type: Number, default: null, index: true },
    csv_passable: { type: Number, default: null, index: true },
    csv_routing_cost: { type: Number, default: null },
    osm_id: { type: Number, default: null, index: true },
    full_id: { type: String, default: null, index: true },
    osm_type: { type: String, default: null },
    highway: { type: String, default: null },
  },
  {
    strict: false,
    versionKey: false,
  }
);

floodRoadSchema.index({ geometry: "2dsphere" });

const collectionName = process.env.FLOOD_ROADS_COLLECTION ?? "roads_flood_5yr";

export const FloodRoad = model<IFloodRoad>(
  "FloodRoad",
  floodRoadSchema,
  collectionName
);

// Backward-compatible alias used by existing seed scripts.
export const FloodRoadSegment = FloodRoad;
