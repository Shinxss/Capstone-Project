import { Schema, model } from "mongoose";

export type GeoJSONLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

export interface IFloodRoadSegment {
  // OSM identifiers
  full_id?: string; // e.g. "w28412383"
  osm_id?: number; // e.g. 28412383
  osm_type?: string; // e.g. "way"

  // road metadata
  highway?: string;

  // joined dataset (may be null for many features in the 6k file)
  csv_flood_depth_5yr?: number | null;
  csv_passable?: number | null;
  csv_routing_cost?: number | null;

  // GeoJSON geometry
  geometry: GeoJSONLineString;

  // keep everything else (optional, useful for debugging)
  rawProperties?: Record<string, unknown>;
}

const floodRoadSchema = new Schema<IFloodRoadSegment>(
  {
    full_id: { type: String, index: true },
    osm_id: { type: Number, index: true },
    osm_type: { type: String, index: true },
    highway: { type: String, index: true },

    csv_flood_depth_5yr: { type: Number, default: null, index: true },
    csv_passable: { type: Number, default: null, index: true },
    csv_routing_cost: { type: Number, default: null },

    geometry: {
  type: {
    type: String,
    enum: ["LineString"],
    required: true,
  },
  // ✅ replace Array with nested Number arrays
  coordinates: { type: [[Number]], required: true },
},

    rawProperties: { type: Schema.Types.Mixed, required: false },
  },
  {
    strict: "throw",
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        const { __v: _version, ...clean } = ret as Record<string, unknown> & {
          __v?: unknown;
        };
        return clean;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        const { __v: _version, ...clean } = ret as Record<string, unknown> & {
          __v?: unknown;
        };
        return clean;
      },
    },
  }
);

// Geo index for $nearSphere / spatial matching
floodRoadSchema.index({ geometry: "2dsphere" });

// store under a stable collection name:
export const FloodRoadSegment = model<IFloodRoadSegment>(
  "FloodRoadSegment",
  floodRoadSchema,
  "roads_flood_5yr"
);
