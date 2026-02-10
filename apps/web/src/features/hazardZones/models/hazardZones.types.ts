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
  /** Persisted visibility status (default true if missing from older docs) */
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
};

export type CreateHazardZoneInput = {
  name: string;
  hazardType: HazardType;
  geometry: GeoJSONPolygon;
};
