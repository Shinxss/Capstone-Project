import type { HazardType } from "../constants/hazardZones.constants";

export type GeoJSONPolygon = {
  type: "Polygon" | "MultiPolygon";
  coordinates: any;
};

export type HazardZone = {
  _id: string;
  name: string;
  hazardType: HazardType | string;
  geometry: GeoJSONPolygon;
  createdAt?: string;
};

export type CreateHazardZoneInput = {
  name: string;
  hazardType: HazardType;
  geometry: GeoJSONPolygon;
};
