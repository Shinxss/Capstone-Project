import type { MapStyleKey } from "../models/lguLiveMap.types";

export const DAGUPAN_CENTER: [number, number] = [120.34, 16.043];

export const MAP_STYLE_URL: Record<MapStyleKey, string> = {
  "satellite-streets-v12": "mapbox://styles/mapbox/satellite-streets-v12",
  "streets-v12": "mapbox://styles/mapbox/streets-v12",
  "dark-v11": "mapbox://styles/mapbox/dark-v11",
};
