import { HazardZone } from "../hazardZones/hazardZone.model";
import {
  MAX_ROUTE_CANDIDATES,
  MAX_STEPS_PER_ROUTE,
  type OptimizeRouteInput,
} from "./routing.validation";
import { getWeatherSummary } from "../weather/weather.service";
import { computeFloodStatsForRoute } from "../floodRoads/floodRoad.service";
import {
  predictRoutingRiskCosts,
  type RoutingRiskFeatureRow,
  type RoutingRiskLevel,
} from "../routingRisk/routingRisk.service";
import {
  FLOOD_HARD_BLOCK_DEPTH_M,
  FLOOD_PASSABLE_DEPTH_MAX_M,
} from "../../constants/floodRouting.constants";

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
const OPTIMIZE_PASSABILITY_SCORE_WEIGHT = 0.2;
const OPTIMIZE_PASSABLE_MIN = 0.45;
const OPTIMIZE_PREFERRED_PASSABLE_MIN = 0.7;

const HAZARD_PENALTY_SECONDS: Record<string, number> = {
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

type RoutePassabilityBand =
  | "PASSABLE"
  | "USUALLY_NOT_PASSABLE"
  | "HARD_BLOCKED"
  | null;

type CandidateRoute = {
  index: number;
  distance: number;
  duration: number;
  geometry: LineStringGeometry;
  features: RoutingRiskFeatureRow;
  weatherIsRaining: 0 | 1;
  blocked: boolean;
  hazardPenaltySeconds: number;
  floodCoverageMatchedPoints?: number;
  floodCoverageSamplePoints?: number;
  floodCoverageAvailable?: boolean;
  floodAvgDepth?: number;
  floodMaxDepth?: number;
  floodPenaltySeconds?: number;
  floodBlocked?: boolean;
  floodImpassableRatio?: number;
  floodHasImpassableSegments?: boolean;
  risk_level?: RoutingRiskLevel;
  recommended_speed_kph?: number;
  routing_cost?: number;
  passability_probability?: number;
  passability_band?: RoutePassabilityBand;
  route_passable?: boolean;
  finalScore?: number;
};

type ScoredCandidates = {
  candidates: CandidateRoute[];
  chosen: CandidateRoute | null;
};

type ScoreSelectionMode = "optimize" | "evaluate";

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
    risk_level?: RoutingRiskLevel;
    recommended_speed_kph?: number;
    passability_probability?: number;
    passability_band?: RoutePassabilityBand;
    route_passable?: boolean;
  };
  candidates: Array<{
    index: number;
    geometry: LineStringGeometry;
    distance: number;
    duration: number;
    blocked: boolean;
    floodCoverageMatchedPoints?: number;
    floodCoverageSamplePoints?: number;
    floodCoverageAvailable?: boolean;
    floodAvgDepth?: number;
    floodMaxDepth?: number;
    floodPenaltySeconds?: number;
    floodBlocked?: boolean;
    floodImpassableRatio?: number;
    floodHasImpassableSegments?: boolean;
    risk_level?: RoutingRiskLevel;
    recommended_speed_kph?: number;
    routing_cost: number;
    passability_probability?: number;
    passability_band?: RoutePassabilityBand;
    route_passable?: boolean;
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
  if (input === 1 || input === "1" || input === true || input === "true") {
    return 1;
  }
  return 0;
}

function normalizeRoutingWeather(input: {
  rainfall_mm?: unknown;
  is_raining?: unknown;
}): RoutingWeatherInput {
  const rainfall_mm = toNonNegativeNumber(input.rainfall_mm ?? 0);
  const hasExplicitRainFlag =
    input.is_raining === 0 ||
    input.is_raining === 1 ||
    input.is_raining === "0" ||
    input.is_raining === "1";
  const is_raining = hasExplicitRainFlag
    ? toRainFlag(input.is_raining)
    : rainfall_mm > 0
      ? 1
      : 0;
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

function deriveLegacyPassability(candidate: CandidateRoute): {
  probability: number;
  band: RoutePassabilityBand;
  routePassable: boolean;
} {
  const effectiveDepth = toNonNegativeNumber(
    candidate.floodMaxDepth ?? candidate.floodAvgDepth ?? candidate.features.flood_depth_5yr
  );
  const isRainingNow = candidate.weatherIsRaining === 1;
  const exceedsPassableDepth = effectiveDepth > FLOOD_PASSABLE_DEPTH_MAX_M;
  const exceedsHardBlockDepth = effectiveDepth >= FLOOD_HARD_BLOCK_DEPTH_M;

  if (candidate.blocked || candidate.floodBlocked === true) {
    return {
      probability: 0,
      band: "HARD_BLOCKED",
      routePassable: false,
    };
  }

  // Requested behavior:
  // csv_flood_depth_5yr > 0.5m + raining => not passable
  // csv_flood_depth_5yr > 0.5m + not raining => passable
  // csv_flood_depth_5yr < 0.5m => passable (rain or dry)
  if (exceedsPassableDepth && isRainingNow) {
    return {
      probability: exceedsHardBlockDepth ? 0 : 0.3,
      band: exceedsHardBlockDepth ? "HARD_BLOCKED" : "USUALLY_NOT_PASSABLE",
      routePassable: false,
    };
  }

  if (exceedsPassableDepth) {
    return {
      probability: 0.7,
      band: "USUALLY_NOT_PASSABLE",
      routePassable: true,
    };
  }

  return {
    probability: 0.7,
    band: "PASSABLE",
    routePassable: true,
  };
}

function toPassabilityProbability(candidate: CandidateRoute): number {
  return clamp(toNonNegativeNumber(candidate.passability_probability ?? 0), 0, 1);
}

function chooseBaselineCandidate(candidates: CandidateRoute[]): CandidateRoute | null {
  if (!candidates.length) return null;
  return candidates.reduce((best, current) => (current.index < best.index ? current : best));
}

function compareOptimizedCandidates(a: CandidateRoute, b: CandidateRoute): number {
  const byPassability = toPassabilityProbability(b) - toPassabilityProbability(a);
  if (byPassability !== 0) return byPassability;

  const byCost =
    toNonNegativeNumber(a.routing_cost ?? BLOCKED_ROUTE_SCORE) -
    toNonNegativeNumber(b.routing_cost ?? BLOCKED_ROUTE_SCORE);
  if (byCost !== 0) return byCost;

  const byScore =
    toNonNegativeNumber(a.finalScore ?? BLOCKED_ROUTE_SCORE) -
    toNonNegativeNumber(b.finalScore ?? BLOCKED_ROUTE_SCORE);
  if (byScore !== 0) return byScore;

  const byDuration =
    toNonNegativeNumber(a.duration + a.hazardPenaltySeconds) -
    toNonNegativeNumber(b.duration + b.hazardPenaltySeconds);
  if (byDuration !== 0) return byDuration;

  const byDistance = toNonNegativeNumber(a.distance) - toNonNegativeNumber(b.distance);
  if (byDistance !== 0) return byDistance;

  return a.index - b.index;
}

function chooseOptimizationCandidate(candidates: CandidateRoute[]): CandidateRoute | null {
  if (!candidates.length) return null;

  const stronglyPassable = candidates.filter(
    (candidate) =>
      candidate.route_passable === true &&
      toPassabilityProbability(candidate) >= OPTIMIZE_PREFERRED_PASSABLE_MIN
  );
  const cautionPassable = candidates.filter(
    (candidate) =>
      candidate.route_passable === true &&
      toPassabilityProbability(candidate) >= OPTIMIZE_PASSABLE_MIN
  );
  const passable = candidates.filter((candidate) => candidate.route_passable === true);

  const pool = stronglyPassable.length
    ? stronglyPassable
    : cautionPassable.length
      ? cautionPassable
      : passable.length
        ? passable
        : candidates;

  return pool.reduce((best, current) =>
    compareOptimizedCandidates(current, best) < 0 ? current : best
  );
}

function buildDirectionsMultiCoordinatesPath(points: Coordinates[]): string {
  return points.map(([lng, lat]) => `${lng},${lat}`).join(";");
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
  const mapboxAccessToken: string = mapboxToken;

  const start: Coordinates = [payload.start.lng, payload.start.lat];
  const end: Coordinates = [payload.end.lng, payload.end.lat];

  async function fetchDirections(options: {
    coords: Coordinates[];
    exclude?: Coordinates[];
    alternatives?: boolean;
    continueStraight?: boolean;
  }): Promise<MapboxRoute[]> {
    const url = new URL(
      `${MAPBOX_DIRECTIONS_BASE}/${payload.profile}/${buildDirectionsMultiCoordinatesPath(
        options.coords
      )}`
    );

    url.searchParams.set("alternatives", options.alternatives ? "true" : "false");
    url.searchParams.set("steps", "true");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("access_token", mapboxAccessToken);

    if (typeof options.continueStraight === "boolean") {
      url.searchParams.set(
        "continue_straight",
        options.continueStraight ? "true" : "false"
      );
    }

    if (options.exclude?.length) {
      url.searchParams.set("exclude", toExcludeParam(options.exclude));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw createServiceError("Directions provider request failed.", 502);
    }

    const body = (await response.json()) as MapboxDirectionsResponse;
    const routes = Array.isArray(body.routes) ? body.routes : [];
    // Debug: confirm whether Mapbox is returning alternatives.
    // IMPORTANT: never log access tokens.
    const safeUrl = url.toString().replace(/access_token=[^&]+/i, "access_token=REDACTED");
    console.log("[Mapbox] url:", safeUrl);
    console.log("[Mapbox] routes returned:", routes.length);
    return routes;
  }

  function routeKey(route: MapboxRoute): string {
    const d = Math.round(toNonNegativeNumber(route.distance));
    const t = Math.round(toNonNegativeNumber(route.duration));
    const coords = isLineStringGeometry(route.geometry) ? route.geometry.coordinates : [];
    if (coords.length < 2) return `${d}-${t}`;
    const mid = coords[Math.floor(coords.length / 2)] ?? coords[0];
    return `${d}-${t}-${toPointKey(coords[0])}|${toPointKey(mid)}|${toPointKey(
      coords[coords.length - 1]
    )}`;
  }

  function sampleExcludePointsFromRoute(route: MapboxRoute): Coordinates[] {
    const coords = isLineStringGeometry(route.geometry) ? route.geometry.coordinates : [];
    if (coords.length < 6) return [];
    const picks = [0.2, 0.4, 0.6, 0.8]
      .map((p) => coords[Math.floor(coords.length * p)])
      .filter(Boolean) as Coordinates[];

    const out: Coordinates[] = [];
    const seen = new Set<string>();
    for (const pt of picks) {
      const key = toPointKey(pt);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(pt);
    }
    return out;
  }

  function metersToDegLat(meters: number): number {
    return meters / 111_320;
  }

  function metersToDegLng(meters: number, latDeg: number): number {
    const latRad = (latDeg * Math.PI) / 180;
    const denom = 111_320 * Math.cos(latRad);
    if (!Number.isFinite(denom) || denom === 0) return 0;
    return meters / denom;
  }

  function sampleDetourWaypoints(route: MapboxRoute): Coordinates[] {
    const coords = isLineStringGeometry(route.geometry) ? route.geometry.coordinates : [];
    if (coords.length < 4) return [];

    const midIdx = Math.floor(coords.length / 2);
    const prev = coords[Math.max(0, midIdx - 1)];
    const mid = coords[midIdx];
    const next = coords[Math.min(coords.length - 1, midIdx + 1)];
    if (!prev || !mid || !next) return [];

    // Approx direction vector
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const mag = Math.hypot(dx, dy);
    if (!Number.isFinite(mag) || mag === 0) return [];

    // Perpendicular unit vector in lng/lat space
    const ux = -dy / mag;
    const uy = dx / mag;

    // Small detours (meters)
    const offsetsM = [350, 650];
    const out: Coordinates[] = [];
    const seen = new Set<string>();

    for (const meters of offsetsM) {
      const dLat = metersToDegLat(meters);
      const dLng = metersToDegLng(meters, mid[1]);

      const cand1: Coordinates = [mid[0] + ux * dLng, mid[1] + uy * dLat];
      const cand2: Coordinates = [mid[0] - ux * dLng, mid[1] - uy * dLat];

      for (const cand of [cand1, cand2]) {
        const norm: Coordinates = [
          roundCoordinate(clamp(cand[0], -180, 180)),
          roundCoordinate(clamp(cand[1], -90, 90)),
        ];
        const key = toPointKey(norm);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(norm);
      }
    }

    return out;
  }

  // 1) Standard call with alternatives=true
  const first = await fetchDirections({
    coords: [start, end],
    exclude: excludePoints,
    alternatives: true,
  });
  if (!first.length) {
    throw createServiceError("No routes returned by directions provider.", 404);
  }

  const pool = new Map<string, MapboxRoute>();
  for (const r of first) pool.set(routeKey(r), r);

  if (pool.size >= 2) {
    return Array.from(pool.values()).slice(0, MAX_ROUTE_CANDIDATES);
  }

  // 2) Retry: toggle continue_straight (sometimes changes start maneuver)
  try {
    const toggled = await fetchDirections({
      coords: [start, end],
      exclude: excludePoints,
      alternatives: true,
      continueStraight: false,
    });
    for (const r of toggled) pool.set(routeKey(r), r);
  } catch {
    // ignore
  }
  if (pool.size >= 2) {
    return Array.from(pool.values()).slice(0, MAX_ROUTE_CANDIDATES);
  }

  // 3) Retry: add exclude points along the first route to force different paths
  const excludeSamples = sampleExcludePointsFromRoute(first[0]);
  for (const pt of excludeSamples) {
    const combined = dedupeExcludePoints([...excludePoints, pt], MAX_EXCLUDE_POINTS);
    try {
      const more = await fetchDirections({
        coords: [start, end],
        exclude: combined,
        alternatives: true,
      });
      for (const r of more) pool.set(routeKey(r), r);
    } catch {
      // ignore
    }
    if (pool.size >= MAX_ROUTE_CANDIDATES) break;
  }
  if (pool.size >= 2) {
    return Array.from(pool.values()).slice(0, MAX_ROUTE_CANDIDATES);
  }

  // 4) Final fallback: force detours via a midpoint waypoint
  const detours = sampleDetourWaypoints(first[0]);
  for (const waypoint of detours) {
    try {
      const detourRoutes = await fetchDirections({
        coords: [start, waypoint, end],
        exclude: excludePoints,
        alternatives: false,
      });
      for (const r of detourRoutes) pool.set(routeKey(r), r);
    } catch {
      // ignore
    }
    if (pool.size >= MAX_ROUTE_CANDIDATES) break;
  }

  return Array.from(pool.values()).slice(0, MAX_ROUTE_CANDIDATES);
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
      weatherIsRaining: weather.is_raining,
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
  const flood = await computeFloodStatsForRoute(route.geometry, weather);

  const hasFloodCoverage = flood.coverage.hasCoverage;
  const weatherForModel = hasFloodCoverage
    ? weather
    : ({
        rainfall_mm: 0,
        is_raining: 0,
      } as const);

  const floodPenaltySeconds = hasFloodCoverage ? flood.penaltySeconds : 0;
  const floodBlocked = hasFloodCoverage ? flood.blockedByFlood : false;

  const hazardPenaltySeconds = computeHazardPenaltySeconds(hazardTypes) + floodPenaltySeconds;
  const blocked = hazardTypes.has(ROAD_HAZARD_TYPE) || floodBlocked;

  return {
    index,
    distance,
    duration,
    geometry: route.geometry,
    weatherIsRaining: weather.is_raining,
    blocked,
    hazardPenaltySeconds,
    floodCoverageMatchedPoints: flood.coverage.matchedPointCount,
    floodCoverageSamplePoints: flood.coverage.samplePointCount,
    floodCoverageAvailable: hasFloodCoverage,
    floodAvgDepth: hasFloodCoverage ? flood.avgDepth : 0,
    floodMaxDepth: flood.maxDepth,
    floodPenaltySeconds,
    floodBlocked,
    floodImpassableRatio: flood.impassableRatio,
    floodHasImpassableSegments: flood.hasImpassableSegments,
    features: {
      flood_depth_5yr: hasFloodCoverage ? flood.depthForModel : 0,
      rainfall_mm: weatherForModel.rainfall_mm,
      is_raining: weatherForModel.is_raining,
      bridge: bridgeAndPriority.bridge,
      road_priority: bridgeAndPriority.road_priority,
    },
  };
}

async function scoreEvaluatedCandidates(
  candidates: CandidateRoute[],
  options: { allowBlockedSelection?: boolean; selectionMode?: ScoreSelectionMode } = {}
): Promise<ScoredCandidates> {
  const allowBlockedSelection = Boolean(options.allowBlockedSelection);
  const selectionMode = options.selectionMode ?? "optimize";
  const scorable = candidates.filter((candidate) => candidate.geometry.coordinates.length >= 2);

  if (!scorable.length) {
    return { candidates, chosen: null };
  }

  const predictions = await predictRoutingRiskCosts(
    scorable.map((candidate) => candidate.features)
  );

  for (let i = 0; i < scorable.length; i += 1) {
    const candidate = scorable[i];
    const prediction = predictions[i];
    const cost = toNonNegativeNumber(prediction?.routing_cost ?? 0);
    candidate.routing_cost = cost;
    candidate.risk_level = prediction?.risk_level;
    candidate.recommended_speed_kph = prediction?.recommended_speed_kph;
    const passability = deriveLegacyPassability(candidate);
    candidate.passability_probability = passability.probability;
    candidate.passability_band = passability.band;
    candidate.route_passable = passability.routePassable;
  }

  const costValues = scorable.map((candidate) => candidate.routing_cost ?? 0);
  const durationValues = scorable.map(
    (candidate) => candidate.duration + candidate.hazardPenaltySeconds
  );
  const distanceValues = scorable.map((candidate) => candidate.distance);

  const costMin = Math.min(...costValues);
  const costMax = Math.max(...costValues);
  const durationMin = Math.min(...durationValues);
  const durationMax = Math.max(...durationValues);
  const distanceMin = Math.min(...distanceValues);
  const distanceMax = Math.max(...distanceValues);

  for (const candidate of scorable) {
    const effectiveDuration = candidate.duration + candidate.hazardPenaltySeconds;

    const normCost = normalizeValue(candidate.routing_cost ?? 0, costMin, costMax);
    const normDuration = normalizeValue(effectiveDuration, durationMin, durationMax);
    const normDistance = normalizeValue(candidate.distance, distanceMin, distanceMax);
    const passabilityPenalty = 1 - toPassabilityProbability(candidate);

    candidate.finalScore =
      SCORE_WEIGHTS.modelCost * normCost +
      SCORE_WEIGHTS.durationSec * normDuration +
      SCORE_WEIGHTS.distanceM * normDistance +
      OPTIMIZE_PASSABILITY_SCORE_WEIGHT * passabilityPenalty;
  }

  const choicePool = allowBlockedSelection
    ? scorable
    : scorable.filter((candidate) => !candidate.blocked);

  if (!choicePool.length) {
    return { candidates, chosen: null };
  }

  const chosen =
    selectionMode === "evaluate"
      ? chooseBaselineCandidate(choicePool)
      : chooseOptimizationCandidate(choicePool);

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
      risk_level: chosen.risk_level,
      recommended_speed_kph: chosen.recommended_speed_kph,
      passability_probability: clamp(
        toNonNegativeNumber(chosen.passability_probability ?? 0),
        0,
        1
      ),
      passability_band: chosen.passability_band,
      route_passable: chosen.route_passable,
    },
    candidates: candidates.map((candidate) => ({
      index: candidate.index,
      geometry: candidate.geometry,
      distance: candidate.distance,
      duration: candidate.duration,
      blocked: candidate.blocked,
      floodCoverageMatchedPoints: candidate.floodCoverageMatchedPoints,
      floodCoverageSamplePoints: candidate.floodCoverageSamplePoints,
      floodCoverageAvailable: candidate.floodCoverageAvailable,
      floodAvgDepth: candidate.floodAvgDepth,
      floodMaxDepth: candidate.floodMaxDepth,
      floodPenaltySeconds: candidate.floodPenaltySeconds,
      floodBlocked: candidate.floodBlocked,
      floodImpassableRatio: candidate.floodImpassableRatio,
      floodHasImpassableSegments: candidate.floodHasImpassableSegments,
      risk_level: candidate.risk_level,
      recommended_speed_kph: candidate.recommended_speed_kph,
      routing_cost: toSerializableNumber(candidate.routing_cost ?? BLOCKED_ROUTE_SCORE),
      passability_probability: clamp(
        toNonNegativeNumber(candidate.passability_probability ?? 0),
        0,
        1
      ),
      passability_band: candidate.passability_band,
      route_passable: candidate.route_passable,
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
  const mode = payload.mode ?? "optimize";

  if (mode === "evaluate") {
    const evalRoutes = await getDirections(payload);
    const evalCandidates = await Promise.all(
      evalRoutes.map((route, index) => evaluateRouteCandidate(route, index, weather))
    );

    const evalScored = await scoreEvaluatedCandidates(evalCandidates, {
      allowBlockedSelection: true,
      selectionMode: "evaluate",
    });

    const chosen =
      chooseBaselineCandidate(
        evalScored.candidates.filter((candidate) => candidate.geometry.coordinates.length >= 2)
      ) ?? evalScored.chosen;

    if (!chosen) {
      throw createServiceError("No route geometry available for route evaluation.", 409);
    }

    return buildOptimizedRouteResult(evalScored.candidates, chosen, usedWeather);
  }

  const pass1Routes = await getDirections(payload);
  const pass1Candidates = await Promise.all(
    pass1Routes.map((route, index) => evaluateRouteCandidate(route, index, weather))
  );

  const pass1Scored = await scoreEvaluatedCandidates(pass1Candidates, {
    allowBlockedSelection: false,
    selectionMode: "optimize",
  });
  if (pass1Scored.chosen) {
    return buildOptimizedRouteResult(pass1Scored.candidates, pass1Scored.chosen, usedWeather);
  }

  const excludePoints = await buildRoadClosedExcludePoints(pass1Routes);
  if (!excludePoints.length) {
    const pass1Relaxed = await scoreEvaluatedCandidates(pass1Candidates, {
      allowBlockedSelection: true,
      selectionMode: "optimize",
    });

    if (pass1Relaxed.chosen) {
      return buildOptimizedRouteResult(pass1Relaxed.candidates, pass1Relaxed.chosen, usedWeather);
    }

    throw createServiceError(
      "No route geometry available after relaxed flood-block fallback.",
      409
    );
  }

  let pass2Routes: MapboxRoute[];
  try {
    pass2Routes = await getDirections(payload, excludePoints);
  } catch (error) {
    const err = error as ServiceError;
    if (err.statusCode === 404) {
      const pass1Relaxed = await scoreEvaluatedCandidates(pass1Candidates, {
        allowBlockedSelection: true,
        selectionMode: "optimize",
      });
      if (pass1Relaxed.chosen) {
        return buildOptimizedRouteResult(pass1Relaxed.candidates, pass1Relaxed.chosen, usedWeather);
      }
      throw createServiceError(
        "No route geometry available after relaxed flood-block fallback.",
        409
      );
    }
    throw err;
  }

  const pass2Candidates = await Promise.all(
    pass2Routes.map((route, index) => evaluateRouteCandidate(route, index, weather))
  );

  const pass2Scored = await scoreEvaluatedCandidates(pass2Candidates, {
    allowBlockedSelection: false,
    selectionMode: "optimize",
  });
  if (pass2Scored.chosen) {
    return buildOptimizedRouteResult(pass2Scored.candidates, pass2Scored.chosen, usedWeather);
  }

  const pass2Relaxed = await scoreEvaluatedCandidates(pass2Candidates, {
    allowBlockedSelection: true,
    selectionMode: "optimize",
  });
  if (pass2Relaxed.chosen) {
    return buildOptimizedRouteResult(pass2Relaxed.candidates, pass2Relaxed.chosen, usedWeather);
  }

  const pass1Relaxed = await scoreEvaluatedCandidates(pass1Candidates, {
    allowBlockedSelection: true,
    selectionMode: "optimize",
  });
  if (pass1Relaxed.chosen) {
    return buildOptimizedRouteResult(pass1Relaxed.candidates, pass1Relaxed.chosen, usedWeather);
  }

  throw createServiceError("No route geometry available after relaxed flood-block fallback.", 409);
}
