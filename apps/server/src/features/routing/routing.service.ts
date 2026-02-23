import { HazardZone } from "../hazardZones/hazardZone.model";
import {
  MAX_ROUTE_CANDIDATES,
  MAX_STEPS_PER_ROUTE,
  type OptimizeRouteInput,
} from "./routing.validation";
import { predictRoutingRiskCosts, type RoutingRiskModelRow } from "./routingRiskModel";
import { getWeatherSummary } from "../weather/weather.service";

const MAPBOX_DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5/mapbox";
const BLOCKED_ROUTE_SCORE = Number.MAX_SAFE_INTEGER;
const ROAD_HAZARD_TYPE = "ROAD_CLOSED";
const MAX_PASS2_POLYGONS = 8;
const MAX_EXCLUDE_POINTS = 50;
const EXCLUDE_POINTS_PER_POLYGON = 8;

const SCORE_WEIGHTS = {
  modelCost: 0.6,
  durationSec: 0.3,
  distanceM: 0.1,
} as const;

const HAZARD_PENALTY_SECONDS: Record<string, number> = {
  FLOODED: 10 * 60,
  LANDSLIDE: 15 * 60,
  FIRE_RISK: 12 * 60,
  UNSAFE: 6 * 60,
};

type ServiceError = Error & { statusCode?: number };
type Coordinates = [number, number];

type LineStringGeometry = {
  type: "LineString";
  coordinates: Coordinates[];
};

type PolygonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type MapboxIntersection = {
  classes?: string[];
};

type MapboxStep = {
  duration?: number;
  intersections?: MapboxIntersection[];
};

type MapboxLeg = {
  steps?: MapboxStep[];
};

type MapboxRoute = {
  distance?: number;
  duration?: number;
  geometry?: LineStringGeometry;
  legs?: MapboxLeg[];
};

type MapboxDirectionsResponse = {
  routes?: MapboxRoute[];
};

type CandidateRoute = {
  index: number;
  distance: number;
  duration: number;
  geometry: LineStringGeometry;
  features: RoutingRiskModelRow;
  blocked: boolean;
  hazardPenaltySeconds: number;
  routing_cost?: number;
  finalScore?: number;
};

type ScoredCandidates = {
  candidates: CandidateRoute[];
  chosen: CandidateRoute | null;
};

type RoutingWeatherInput = NonNullable<OptimizeRouteInput["weather"]>;

type UsedWeather = {
  rainfall_mm: number;
  is_raining: 0 | 1;
  source: "request" | "open-meteo";
  updatedAt: string;
};

export type OptimizedRouteResult = {
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
    blocked: boolean;
    routing_cost: number;
    finalScore: number;
  }>;
  usedWeather: UsedWeather;
};

function createServiceError(message: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

function toNonNegativeNumber(input: unknown): number {
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function toRainFlag(input: unknown): 0 | 1 {
  return input === 1 ? 1 : 0;
}

function normalizeRoutingWeather(input: {
  rainfall_mm?: unknown;
  is_raining?: unknown;
}): RoutingWeatherInput {
  const rainfall_mm = toNonNegativeNumber(input.rainfall_mm ?? 0);
  const is_raining = toRainFlag(input.is_raining) || rainfall_mm > 0 ? 1 : 0;
  return {
    rainfall_mm,
    is_raining,
  };
}

async function resolveRoutingWeather(payload: OptimizeRouteInput): Promise<{
  weather: RoutingWeatherInput;
  usedWeather: UsedWeather;
}> {
  if (payload.weather) {
    const weather = normalizeRoutingWeather(payload.weather);
    return {
      weather,
      usedWeather: {
        ...weather,
        source: "request",
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const weatherSummary = await getWeatherSummary(payload.start.lat, payload.start.lng);
  const weather = normalizeRoutingWeather({
    rainfall_mm: weatherSummary.rainfall_mm,
    is_raining: weatherSummary.is_raining,
  });

  return {
    weather,
    usedWeather: {
      ...weather,
      source: "open-meteo",
      updatedAt: weatherSummary.updatedAt,
    },
  };
}

function toSerializableNumber(value: number): number {
  return Number.isFinite(value) ? value : BLOCKED_ROUTE_SCORE;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

function toPointKey(point: Coordinates): string {
  return `${point[0].toFixed(6)},${point[1].toFixed(6)}`;
}

function isLineStringGeometry(value: unknown): value is LineStringGeometry {
  if (!value || typeof value !== "object") return false;
  const geometry = value as LineStringGeometry;
  return (
    geometry.type === "LineString" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2
  );
}

function collectRouteSteps(route: MapboxRoute): MapboxStep[] {
  const steps = (route.legs ?? []).flatMap((leg) =>
    Array.isArray(leg.steps) ? leg.steps : []
  );

  if (steps.length > MAX_STEPS_PER_ROUTE) {
    throw createServiceError(
      `Route contains too many steps (max ${MAX_STEPS_PER_ROUTE}).`,
      400
    );
  }

  return steps;
}

function extractStepClasses(step: MapboxStep): string[] {
  const classes: string[] = [];
  for (const intersection of step.intersections ?? []) {
    for (const className of intersection.classes ?? []) {
      if (typeof className === "string" && className.trim()) {
        classes.push(className.toLowerCase());
      }
    }
  }
  return classes;
}

function toRoadPriority(className: string): 0 | 1 | 2 | 3 {
  if (
    className.includes("motorway") ||
    className.includes("trunk") ||
    className.includes("primary")
  ) {
    return 3;
  }

  if (className.includes("secondary") || className.includes("tertiary")) {
    return 2;
  }

  if (className.includes("residential") || className.includes("service")) {
    return 1;
  }

  return 0;
}

function inferRouteBridgeAndPriority(steps: MapboxStep[]): {
  bridge: 0 | 1;
  road_priority: 0 | 1 | 2 | 3;
} {
  const allClasses = steps.flatMap(extractStepClasses);

  if (!allClasses.length) {
    return {
      bridge: 0,
      road_priority: 2,
    };
  }

  let maxPriority: 0 | 1 | 2 | 3 = 0;
  for (const className of allClasses) {
    const priority = toRoadPriority(className);
    if (priority > maxPriority) maxPriority = priority;
    if (maxPriority === 3) break;
  }

  return {
    bridge: allClasses.some((className) => className.includes("bridge")) ? 1 : 0,
    road_priority: maxPriority,
  };
}

function normalizeValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 1;
  if (max <= min) return 0;
  return (value - min) / (max - min);
}

function buildDirectionsCoordinatesPath(start: Coordinates, end: Coordinates): string {
  return `${start[0]},${start[1]};${end[0]},${end[1]}`;
}

function toExcludeParam(excludePoints: Coordinates[]): string {
  return excludePoints
    .map(([lng, lat]) => `point(${roundCoordinate(lng)} ${roundCoordinate(lat)})`)
    .join(",");
}

async function getDirections(
  payload: Pick<OptimizeRouteInput, "start" | "end" | "profile">,
  excludePoints: Coordinates[] = []
): Promise<MapboxRoute[]> {
  const mapboxToken = process.env.MAPBOX_TOKEN?.trim();
  if (!mapboxToken) {
    throw createServiceError("MAPBOX_TOKEN is not configured.", 500);
  }

  const url = new URL(
    `${MAPBOX_DIRECTIONS_BASE}/${payload.profile}/${buildDirectionsCoordinatesPath(
      [payload.start.lng, payload.start.lat],
      [payload.end.lng, payload.end.lat]
    )}`
  );

  url.searchParams.set("alternatives", "true");
  url.searchParams.set("steps", "true");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", mapboxToken);

  if (excludePoints.length) {
    url.searchParams.set("exclude", toExcludeParam(excludePoints));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw createServiceError("Directions provider request failed.", 502);
  }

  const body = (await response.json()) as MapboxDirectionsResponse;
  const routes = Array.isArray(body.routes) ? body.routes : [];
  if (!routes.length) {
    throw createServiceError("No routes returned by directions provider.", 404);
  }

  return routes.slice(0, MAX_ROUTE_CANDIDATES);
}

function computeHazardPenaltySeconds(hazardTypes: Set<string>): number {
  let penalty = 0;
  for (const hazardType of hazardTypes) {
    penalty += HAZARD_PENALTY_SECONDS[hazardType] ?? 0;
  }
  return penalty;
}

async function evaluateRouteCandidate(
  route: MapboxRoute,
  index: number,
  weather: RoutingWeatherInput
): Promise<CandidateRoute> {
  const distance = toNonNegativeNumber(route.distance);
  const duration = toNonNegativeNumber(route.duration);
  const steps = collectRouteSteps(route);

  if (!isLineStringGeometry(route.geometry)) {
    return {
      index,
      distance,
      duration,
      geometry: { type: "LineString", coordinates: [] },
      blocked: true,
      hazardPenaltySeconds: 0,
      features: {
        flood_depth_5yr: 0,
        rainfall_mm: weather.rainfall_mm,
        is_raining: weather.is_raining,
        bridge: 0,
        road_priority: 2,
      },
    };
  }

  const hazardResults = (await HazardZone.find({
    deletedAt: null,
    isActive: true,
    geometry: { $geoIntersects: { $geometry: route.geometry } },
  } as any)
    .select("hazardType")
    .lean()) as Array<{ hazardType?: string }>;

  const hazardTypes = new Set(
    hazardResults.map((entry) => String(entry.hazardType ?? "").toUpperCase())
  );

  const bridgeAndPriority = inferRouteBridgeAndPriority(steps);

  return {
    index,
    distance,
    duration,
    geometry: route.geometry,
    blocked: hazardTypes.has(ROAD_HAZARD_TYPE),
    hazardPenaltySeconds: computeHazardPenaltySeconds(hazardTypes),
    features: {
      flood_depth_5yr: hazardTypes.has("FLOODED") ? 1 : 0,
      rainfall_mm: weather.rainfall_mm,
      is_raining: weather.is_raining,
      bridge: bridgeAndPriority.bridge,
      road_priority: bridgeAndPriority.road_priority,
    },
  };
}

async function scoreEvaluatedCandidates(candidates: CandidateRoute[]): Promise<ScoredCandidates> {
  const routable = candidates.filter(
    (candidate) => !candidate.blocked && candidate.geometry.coordinates.length >= 2
  );

  if (!routable.length) {
    return { candidates, chosen: null };
  }

  const modelCosts = await predictRoutingRiskCosts(
    routable.map((candidate) => candidate.features)
  );

  for (let i = 0; i < routable.length; i += 1) {
    routable[i].routing_cost = toNonNegativeNumber(modelCosts[i] ?? 0);
  }

  const costValues = routable.map((candidate) => candidate.routing_cost ?? 0);
  const durationValues = routable.map(
    (candidate) => candidate.duration + candidate.hazardPenaltySeconds
  );
  const distanceValues = routable.map((candidate) => candidate.distance);

  const costMin = Math.min(...costValues);
  const costMax = Math.max(...costValues);
  const durationMin = Math.min(...durationValues);
  const durationMax = Math.max(...durationValues);
  const distanceMin = Math.min(...distanceValues);
  const distanceMax = Math.max(...distanceValues);

  for (let i = 0; i < routable.length; i += 1) {
    const candidate = routable[i];
    const effectiveDuration = candidate.duration + candidate.hazardPenaltySeconds;

    const normCost = normalizeValue(candidate.routing_cost ?? 0, costMin, costMax);
    const normDuration = normalizeValue(effectiveDuration, durationMin, durationMax);
    const normDistance = normalizeValue(candidate.distance, distanceMin, distanceMax);

    candidate.finalScore =
      SCORE_WEIGHTS.modelCost * normCost +
      SCORE_WEIGHTS.durationSec * normDuration +
      SCORE_WEIGHTS.distanceM * normDistance;
  }

  const chosen = routable.reduce((best, current) => {
    const bestScore = best.finalScore ?? BLOCKED_ROUTE_SCORE;
    const currentScore = current.finalScore ?? BLOCKED_ROUTE_SCORE;
    return currentScore < bestScore ? current : best;
  });

  return { candidates, chosen };
}

function buildOptimizedRouteResult(
  candidates: CandidateRoute[],
  chosen: CandidateRoute,
  usedWeather: UsedWeather
): OptimizedRouteResult {
  return {
    chosenIndex: chosen.index,
    chosen: {
      geometry: chosen.geometry,
      distance: chosen.distance,
      duration: chosen.duration,
      routing_cost: toSerializableNumber(chosen.routing_cost ?? 0),
      finalScore: toSerializableNumber(chosen.finalScore ?? 0),
    },
    candidates: candidates.map((candidate) => ({
      index: candidate.index,
      distance: candidate.distance,
      duration: candidate.duration,
      blocked: candidate.blocked,
      routing_cost: toSerializableNumber(candidate.routing_cost ?? BLOCKED_ROUTE_SCORE),
      finalScore: toSerializableNumber(candidate.finalScore ?? BLOCKED_ROUTE_SCORE),
    })),
    usedWeather,
  };
}

function collectCoordinatesFromNested(value: unknown, output: Coordinates[]) {
  if (!Array.isArray(value)) return;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    output.push([value[0], value[1]]);
    return;
  }

  for (const child of value) {
    collectCoordinatesFromNested(child, output);
  }
}

function getPolygonBboxPoints(geometry: PolygonGeometry | undefined, count: number): Coordinates[] {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return [];

  const collected: Coordinates[] = [];
  collectCoordinatesFromNested(geometry.coordinates, collected);
  if (!collected.length) return [];

  let minLng = collected[0][0];
  let maxLng = collected[0][0];
  let minLat = collected[0][1];
  let maxLat = collected[0][1];

  for (const [lng, lat] of collected) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const midLng = (minLng + maxLng) / 2;
  const midLat = (minLat + maxLat) / 2;

  const points: Coordinates[] = [
    [midLng, midLat],
    [minLng, minLat],
    [minLng, maxLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [midLng, minLat],
    [midLng, maxLat],
    [minLng, midLat],
    [maxLng, midLat],
  ];

  const limit = clamp(Math.floor(count), 1, points.length);
  return points.slice(0, limit);
}

function dedupeExcludePoints(points: Coordinates[], maxPoints: number): Coordinates[] {
  const deduped: Coordinates[] = [];
  const seen = new Set<string>();

  for (const [rawLng, rawLat] of points) {
    const lng = roundCoordinate(clamp(rawLng, -180, 180));
    const lat = roundCoordinate(clamp(rawLat, -90, 90));
    const point: Coordinates = [lng, lat];
    const key = toPointKey(point);

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(point);

    if (deduped.length >= maxPoints) break;
  }

  return deduped;
}

async function findRelevantRoadClosedHazards(
  routes: MapboxRoute[]
): Promise<Array<{ geometry?: PolygonGeometry }>> {
  const routeGeometries = routes
    .map((route) => route.geometry)
    .filter((geometry): geometry is LineStringGeometry => isLineStringGeometry(geometry));

  if (!routeGeometries.length) {
    return [];
  }

  const baseQuery = {
    hazardType: ROAD_HAZARD_TYPE,
    deletedAt: null,
    isActive: true,
  } as const;

  const query =
    routeGeometries.length === 1
      ? {
          ...baseQuery,
          geometry: { $geoIntersects: { $geometry: routeGeometries[0] } },
        }
      : {
          ...baseQuery,
          $or: routeGeometries.map((geometry) => ({
            geometry: { $geoIntersects: { $geometry: geometry } },
          })),
        };

  const hazards = (await HazardZone.find(query as any)
    .select("geometry")
    .limit(MAX_PASS2_POLYGONS)
    .lean()) as Array<{ geometry?: PolygonGeometry }>;

  return hazards;
}

async function buildRoadClosedExcludePoints(routes: MapboxRoute[]): Promise<Coordinates[]> {
  const hazards = await findRelevantRoadClosedHazards(routes);
  if (!hazards.length) return [];

  const collectedPoints: Coordinates[] = [];

  for (const hazard of hazards) {
    const points = getPolygonBboxPoints(hazard.geometry, EXCLUDE_POINTS_PER_POLYGON);
    collectedPoints.push(...points);

    if (collectedPoints.length >= MAX_EXCLUDE_POINTS) {
      break;
    }
  }

  return dedupeExcludePoints(collectedPoints, MAX_EXCLUDE_POINTS);
}

export async function optimizeRoute(payload: OptimizeRouteInput): Promise<OptimizedRouteResult> {
  const { weather, usedWeather } = await resolveRoutingWeather(payload);

  const pass1Routes = await getDirections(payload);
  const pass1Candidates = await Promise.all(
    pass1Routes.map((route, index) => evaluateRouteCandidate(route, index, weather))
  );

  const pass1Scored = await scoreEvaluatedCandidates(pass1Candidates);
  if (pass1Scored.chosen) {
    return buildOptimizedRouteResult(pass1Scored.candidates, pass1Scored.chosen, usedWeather);
  }

  const excludePoints = await buildRoadClosedExcludePoints(pass1Routes);
  if (!excludePoints.length) {
    throw createServiceError("No safe route available (all alternatives blocked).", 409);
  }

  let pass2Routes: MapboxRoute[];
  try {
    pass2Routes = await getDirections(payload, excludePoints);
  } catch (error) {
    const err = error as ServiceError;
    if (err.statusCode === 404) {
      throw createServiceError("No safe route available (all alternatives blocked).", 409);
    }
    throw err;
  }

  const pass2Candidates = await Promise.all(
    pass2Routes.map((route, index) => evaluateRouteCandidate(route, index, weather))
  );

  const pass2Scored = await scoreEvaluatedCandidates(pass2Candidates);
  if (pass2Scored.chosen) {
    return buildOptimizedRouteResult(pass2Scored.candidates, pass2Scored.chosen, usedWeather);
  }

  throw createServiceError("No safe route available (all alternatives blocked).", 409);
}
