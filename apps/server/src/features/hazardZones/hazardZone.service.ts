import { Types } from "mongoose";
import { HazardZone, type HazardType, type GeoJSONPolygon } from "./hazardZone.model";

export async function listHazardZones({ limit = 500 }: { limit?: number }) {
  const docs = await HazardZone.find({ deletedAt: null })
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
    isActive: true,
    deletedAt: null,
  });

  return doc;
}

export async function softDeleteHazardZone(id: string) {
  return HazardZone.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date(), isActive: false } },
    { new: true }
  ).lean();
}

export async function updateHazardZoneStatus(id: string, isActive: boolean) {
  return HazardZone.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { isActive } },
    { new: true }
  ).lean();
}
