import { riskLegend, travelProfiles } from "../../../constants/mapRouting";
import {
  optimizeRouteAI,
  type OptimizeRouteAIData,
  type RoutingProfile,
} from "../../routing/services/routingApi";
import type {
  RiskAssessment,
  RiskLevel,
  RouteSummary,
  TravelMode,
} from "../models/map.types";

type DirectionPoint = {
  lat: number;
  lng: number;
};

type RoutingContextWeather = {
  rainfall_mm?: number;
  is_raining?: 0 | 1;
};

type GetRouteInput = {
  from: DirectionPoint;
  to: DirectionPoint;
  mode: TravelMode;
};

type OptimizeRouteInput = GetRouteInput & {
  contextWeather?: RoutingContextWeather;
};

type OptimizeRouteResult = {
  route: RouteSummary;
  risk: RiskAssessment;
};

type MapboxDirectionsRoute = {
  distance?: number;
  duration?: number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type MapboxDirectionsResponse = {
  routes?: MapboxDirectionsRoute[];
};

const MAX_STANDARD_RECOMMENDATIONS = 2;

function toTravelProfile(mode: TravelMode): RoutingProfile {
  return mode === "walk" ? travelProfiles.walk : travelProfiles.drive;
}

function toDistanceKm(distanceMeters: number): number {
  return Number((distanceMeters / 1000).toFixed(1));
}

function toDurationMin(durationSeconds: number): number {
  return Math.max(1, Math.round(durationSeconds / 60));
}

function toRouteSummary(input: {
  source: "standard" | "ai";
  mode: TravelMode;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
}): RouteSummary {
  return {
    source: input.source,
    travelMode: input.mode,
    profile: toTravelProfile(input.mode),
    distanceMeters: input.distanceMeters,
    durationSeconds: input.durationSeconds,
    distanceKm: toDistanceKm(input.distanceMeters),
    durationMin: toDurationMin(input.durationSeconds),
    geometry: {
      type: "LineString",
      coordinates: input.coordinates,
    },
  };
}

function toRiskLevel(routingCost: number): RiskLevel {
  if (!Number.isFinite(routingCost)) return "LOW";
  if (routingCost <= 2.5) return "LOW";
  if (routingCost <= 4.5) return "MEDIUM";
  return "HIGH";
}

function toFiniteScore(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function buildRiskJustification(input: {
  level: RiskLevel;
  usedWeather?: OptimizeRouteAIData["usedWeather"] | null;
  chosenCandidate?: OptimizeRouteAIData["candidates"][number] | null;
}): string {
  const reasons: string[] = [];
  const rainfall = Number(input.usedWeather?.rainfall_mm ?? 0);
  const floodDepth =
    typeof input.chosenCandidate?.floodMaxDepth === "number"
      ? input.chosenCandidate.floodMaxDepth
      : null;

  if (input.chosenCandidate?.blocked) {
    reasons.push("route intersects blocked or highly hazardous segments");
  }

  if (input.chosenCandidate?.floodBlocked) {
    reasons.push("flood data marks parts of the route as not safely passable");
  }

  if (floodDepth !== null) {
    if (floodDepth >= 1.5) {
      reasons.push(`estimated flood depth is high (${floodDepth.toFixed(1)} m)`);
    } else if (floodDepth >= 0.5) {
      reasons.push(`estimated flood depth is moderate (${floodDepth.toFixed(1)} m)`);
    } else if (floodDepth >= 0.1) {
      reasons.push(`shallow flood exposure is present (${floodDepth.toFixed(1)} m)`);
    }
  }

  if (rainfall >= 10) {
    reasons.push(`heavy rain (${rainfall.toFixed(1)} mm) increases flood likelihood`);
  } else if (input.usedWeather?.is_raining === 1 && rainfall > 0) {
    reasons.push(`current rain (${rainfall.toFixed(1)} mm) raises flood risk`);
  }

  if (!reasons.length) {
    if (input.level === "HIGH") {
      reasons.push("multiple hazard indicators are elevated");
    } else if (input.level === "MEDIUM") {
      reasons.push("some hazard indicators are elevated");
    } else {
      reasons.push("weather and flood indicators are currently low");
    }
  }

  return `Why ${input.level.toLowerCase()} risk: ${reasons.slice(0, 2).join("; ")}.`;
}

async function fetchDirectionsRoutes(input: GetRouteInput): Promise<MapboxDirectionsRoute[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
  if (!token) {
    throw new Error("Missing Mapbox token");
  }

  const profile = toTravelProfile(input.mode);
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
    `${input.from.lng},${input.from.lat};${input.to.lng},${input.to.lat}` +
    `?alternatives=true&geometries=geojson&overview=full&steps=false&access_token=${token}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Directions API failed");
  }

  const body = (await response.json()) as MapboxDirectionsResponse;
  const routes = Array.isArray(body.routes) ? body.routes : [];
  if (!routes.length) {
    throw new Error("No route returned");
  }

  return routes;
}

function toValidRouteSummaries(input: {
  mode: TravelMode;
  routes: MapboxDirectionsRoute[];
}): RouteSummary[] {
  return input.routes
    .filter(
      (route) =>
        route.geometry?.type === "LineString" &&
        Array.isArray(route.geometry.coordinates) &&
        route.geometry.coordinates.length >= 2
    )
    .map((route) =>
      toRouteSummary({
        source: "standard",
        mode: input.mode,
        distanceMeters: Number(route.distance ?? 0),
        durationSeconds: Number(route.duration ?? 0),
        coordinates: route.geometry!.coordinates as [number, number][],
      })
    );
}

export async function getRouteAlternatives(input: GetRouteInput): Promise<RouteSummary[]> {
  const routes = await fetchDirectionsRoutes(input);
  const summaries = toValidRouteSummaries({
    mode: input.mode,
    routes,
  }).slice(0, MAX_STANDARD_RECOMMENDATIONS);

  if (!summaries.length) {
    throw new Error("No valid route returned");
  }

  return summaries;
}

export async function getRoute(input: GetRouteInput): Promise<RouteSummary> {
  const alternatives = await getRouteAlternatives(input);
  const route = alternatives[0];

  if (!route) {
    throw new Error("No route returned");
  }

  return route;
}

export async function optimizeRoute(input: OptimizeRouteInput): Promise<OptimizeRouteResult> {
  const profile = toTravelProfile(input.mode);
  const optimized = await optimizeRouteAI({
    start: input.from,
    end: input.to,
    profile,
    ...(input.contextWeather ? { weather: input.contextWeather } : {}),
  });

  const coordinates = optimized.chosen.geometry?.coordinates ?? [];
  const candidates = Array.isArray(optimized.candidates) ? optimized.candidates : [];
  const routable = candidates.filter((candidate) => !candidate.blocked);
  const scoringPool = routable.length ? routable : candidates;
  const comparedAgainst = scoringPool.length;
  const sortedScoringPool = [...scoringPool].sort((a, b) => {
    const byScore = toFiniteScore(a.finalScore) - toFiniteScore(b.finalScore);
    if (byScore !== 0) return byScore;
    return a.index - b.index;
  });
  const rankIndex = sortedScoringPool.findIndex(
    (candidate) => candidate.index === optimized.chosenIndex
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : undefined;

  const chosenCandidate =
    candidates.find((candidate) => candidate.index === optimized.chosenIndex) ?? null;
  const floodPassable =
    typeof chosenCandidate?.floodHasImpassableSegments === "boolean"
      ? !chosenCandidate.floodHasImpassableSegments
      : typeof chosenCandidate?.floodBlocked === "boolean"
        ? !chosenCandidate.floodBlocked
        : null;
  const routePassable =
    typeof chosenCandidate?.blocked === "boolean"
      ? !chosenCandidate.blocked && floodPassable !== false
      : floodPassable;

  const route = toRouteSummary({
    source: "ai",
    mode: input.mode,
    distanceMeters: Number(optimized.chosen.distance ?? 0),
    durationSeconds: Number(optimized.chosen.duration ?? 0),
    coordinates,
  });

  const routingCost = Number(optimized.chosen.routing_cost ?? 0);
  const riskLevel = toRiskLevel(routingCost);
  const risk: RiskAssessment = {
    finalScore: Number(optimized.chosen.finalScore ?? 0),
    routingCost,
    comparedAgainst,
    rank,
    riskLevel,
    legendText: riskLegend.join(" / "),
    justification: buildRiskJustification({
      level: riskLevel,
      usedWeather: optimized.usedWeather ?? null,
      chosenCandidate,
    }),
    floodPassable,
    routePassable,
    usedWeather: optimized.usedWeather ?? null,
  };

  return { route, risk };
}

export type { DirectionPoint, RoutingContextWeather, GetRouteInput, OptimizeRouteInput };
