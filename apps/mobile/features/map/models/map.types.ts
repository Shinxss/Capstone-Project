import type { OptimizeRouteAIData } from "../../routing/services/routingApi";

export type EmergencyType = "SOS" | "Flood" | "Fire" | "Typhoon" | "Earthquake" | "Collapse";

export type Emergency = {
  id: string;
  type: EmergencyType;
  title: string;
  description?: string;
  images: string[];
  location: {
    lat: number;
    lng: number;
    label?: string;
  };
  updatedAt?: string;
};

export type TravelMode = "drive" | "walk";

export type RouteSummary = {
  source: "standard" | "ai";
  travelMode: TravelMode;
  profile: "driving" | "walking";
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMin: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RiskAssessment = {
  finalScore: number;
  routingCost: number;
  comparedAgainst?: number;
  rank?: number;
  riskLevel: RiskLevel;
  legendText: string;
  justification: string;
  floodPassable?: boolean | null;
  routePassable?: boolean | null;
  usedWeather?: OptimizeRouteAIData["usedWeather"] | null;
};
