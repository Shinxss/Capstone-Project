import { api } from "../../../lib/api";

export type RoutingProfile = "driving" | "walking";

export type OptimizeRouteAIRequest = {
  start: { lng: number; lat: number };
  end: { lng: number; lat: number };
  profile?: RoutingProfile;
  weather?: {
    rainfall_mm?: number;
    is_raining?: 0 | 1;
  };
};

export type LineStringGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type OptimizeRouteAIData = {
  chosenIndex: number;
  chosen: {
    geometry: LineStringGeometry;
    distance: number;
    duration: number;
    routing_cost: number;
    finalScore: number;
  };
  candidates: Array<{
    index: number;
    distance: number;
    duration: number;
    blocked?: boolean;
    floodMaxDepth?: number;
    floodPenaltySeconds?: number;
    floodBlocked?: boolean;
    floodImpassableRatio?: number;
    floodHasImpassableSegments?: boolean;
    routing_cost: number;
    finalScore: number;
  }>;
  usedWeather?: {
    rainfall_mm: number;
    is_raining: 0 | 1;
    source: "request" | "open-meteo";
    updatedAt: string;
  };
};

type OptimizeRouteAIResponse = {
  data?: OptimizeRouteAIData;
};

export async function optimizeRouteAI(
  payload: OptimizeRouteAIRequest
): Promise<OptimizeRouteAIData> {
  const response = await api.post<OptimizeRouteAIResponse>("/api/routing/optimize", payload);
  const data = response.data?.data;

  if (
    !data ||
    data.chosen?.geometry?.type !== "LineString" ||
    !Array.isArray(data.chosen.geometry.coordinates)
  ) {
    throw new Error("Invalid optimize route response");
  }

  return data;
}
