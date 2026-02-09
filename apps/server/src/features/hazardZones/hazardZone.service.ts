import { Types } from "mongoose";
import { HazardZone, type HazardType, type GeoJSONPolygon } from "./hazardZone.model";

export async function listHazardZones({ limit = 500 }: { limit?: number }) {
  const docs = await HazardZone.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs;
}

export async function createHazardZone(input: {
  name: string;
  hazardType: HazardType;
  geometry: GeoJSONPolygon;
  createdBy?: Types.ObjectId;
}) {
  const doc = await HazardZone.create({
    name: input.name,
    hazardType: input.hazardType,
    geometry: input.geometry,
    createdBy: input.createdBy,
  });

  return doc;
}
