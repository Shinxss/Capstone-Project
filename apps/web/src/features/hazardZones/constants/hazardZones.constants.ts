export type HazardType = "FLOODED" | "ROAD_CLOSED" | "FIRE_RISK" | "LANDSLIDE" | "UNSAFE";

export const HAZARD_TYPES: HazardType[] = [
  "FLOODED",
  "ROAD_CLOSED",
  "FIRE_RISK",
  "LANDSLIDE",
  "UNSAFE",
];

export const HAZARD_TYPE_LABEL: Record<HazardType, string> = {
  FLOODED: "Flooded",
  ROAD_CLOSED: "Road Closed",
  FIRE_RISK: "Fire Risk",
  LANDSLIDE: "Landslide",
  UNSAFE: "Unsafe",
};

export const HAZARD_TYPE_COLOR: Record<HazardType, string> = {
  FLOODED: "#0ea5e9",
  ROAD_CLOSED: "#fb7185",
  FIRE_RISK: "#f97316",
  LANDSLIDE: "#a855f7",
  UNSAFE: "#eab308",
};
