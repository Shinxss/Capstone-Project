import type { MapStyleKey, Volunteer } from "../models/lguLiveMap.types";

export const DAGUPAN_CENTER: [number, number] = [120.34, 16.043];

export const MAP_STYLE_URL: Record<MapStyleKey, string> = {
  "satellite-streets-v12": "mapbox://styles/mapbox/satellite-streets-v12",
  "streets-v12": "mapbox://styles/mapbox/streets-v12",
  "dark-v11": "mapbox://styles/mapbox/dark-v11",
};

// Temporary mock volunteers overlay (until you wire to Mongo)
export const MOCK_VOLUNTEERS: Volunteer[] = [
  {
    id: "v1",
    name: "Juan Dela Cruz",
    status: "available",
    lng: 120.3451,
    lat: 16.0417,
    skill: "First Aid",
  },
  {
    id: "v2",
    name: "Maria Santos",
    status: "busy",
    lng: 120.3369,
    lat: 16.0471,
    skill: "Rescue",
  },
  {
    id: "v3",
    name: "Karlo Sison",
    status: "offline",
    lng: 120.3222,
    lat: 16.051,
    skill: "Logistics",
  },
];
