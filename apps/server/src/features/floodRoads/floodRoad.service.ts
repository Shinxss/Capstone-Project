import { FloodRoad, type GeoJSONLineString } from "./floodRoad.model";

export type LineStringGeometry = GeoJSONLineString;

export type RoutingWeatherInput = {
  rainfall_mm: number;
  is_raining: 0 | 1;
};

export type FloodRouteStats = {
  depthForModel: number;
  maxDepth: number;
  penaltySeconds: number;
  blockedByFlood: boolean;
  impassableRatio: number;
  hasImpassableSegments: boolean;
};

const FLOOD_SAMPLE_POINTS = 16;
const FLOOD_NEAR_DISTANCE_M = 20;
const RAIN_VERY_HEAVY_MM = 25;
const FLOOD_BLOCK_DEPTH_M = 1.8;
const FLOOD_BLOCK_IMPASSABLE_RATIO = 0.6;
const RAIN_SCALE_MM = 25;
const FLOOD_PENALTY_CAP_SEC = 30 * 60;
const PASSABLE_RAIN_PENALTY_CAP_SEC = 12 * 60;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toPointKey([lng, lat]: [number, number]): string {
  return `${lng.toFixed(6)},${lat.toFixed(6)}`;
}

function toNonNegativeNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function getNoFloodStats(): FloodRouteStats {
  return {
    depthForModel: 0,
    maxDepth: 0,
    penaltySeconds: 0,
    blockedByFlood: false,
    impassableRatio: 0,
    hasImpassableSegments: false,
  };
}

function sampleRoutePoints(
  coordinates: [number, number][],
  sampleCount: number
): [number, number][] {
  if (!coordinates.length) return [];

  const sampled: [number, number][] = [];
  if (coordinates.length <= sampleCount) {
    sampled.push(...coordinates);
  } else {
    const maxIndex = coordinates.length - 1;
    for (let i = 0; i < sampleCount; i += 1) {
      const index = Math.round((i * maxIndex) / (sampleCount - 1));
      sampled.push(coordinates[index]);
    }
  }

  const unique: [number, number][] = [];
  const seen = new Set<string>();

  for (const point of sampled) {
    const key = toPointKey(point);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(point);
  }

  return unique;
}

type FloodRoadMatch = {
  csv_flood_depth_5yr?: number | null;
  csv_passable?: number | null;
} | null;

async function findNearestFloodRoadByPoint(
  point: [number, number],
  cache: Map<string, FloodRoadMatch>
): Promise<FloodRoadMatch> {
  const pointKey = toPointKey(point);
  const cached = cache.get(pointKey);
  if (typeof cached !== "undefined") {
    return cached;
  }

  const pointGeometry = {
    type: "Point",
    coordinates: point,
  } as const;

  const nearCondition = {
    $nearSphere: {
      $geometry: pointGeometry,
      $maxDistance: FLOOD_NEAR_DISTANCE_M,
    },
  };

  const nearestAny = (await FloodRoad.findOne({
    geometry: nearCondition,
  } as any)
    .select("csv_flood_depth_5yr csv_passable")
    .lean()) as FloodRoadMatch;

  cache.set(pointKey, nearestAny ?? null);
  return nearestAny ?? null;
}

export async function computeFloodStatsForRoute(
  route: LineStringGeometry,
  weather: RoutingWeatherInput
): Promise<FloodRouteStats> {
  const rainfallMm = toNonNegativeNumber(weather.rainfall_mm) ?? 0;
  if (weather.is_raining !== 1 || rainfallMm <= 0) {
    return getNoFloodStats();
  }

  const samplePoints = sampleRoutePoints(route.coordinates, FLOOD_SAMPLE_POINTS);
  if (!samplePoints.length) {
    return getNoFloodStats();
  }

  const lookupCache = new Map<string, FloodRoadMatch>();
  const nearestMatches = await Promise.all(
    samplePoints.map((point) => findNearestFloodRoadByPoint(point, lookupCache))
  );

  const matchedDepths: number[] = [];
  let impassableCount = 0;
  let lowCount = 0;
  let medCount = 0;
  let highCount = 0;

  for (const match of nearestMatches) {
    if (Number(match?.csv_passable) === 0) {
      impassableCount += 1;
    }

    const depth = toNonNegativeNumber(match?.csv_flood_depth_5yr);
    if (depth !== null) {
      matchedDepths.push(depth);
      if (depth >= 1.5) {
        highCount += 1;
        continue;
      }

      if (depth >= 0.5) {
        medCount += 1;
        continue;
      }

      if (depth >= 0.1) {
        lowCount += 1;
      }
    }
  }

  const denominator = Math.max(samplePoints.length, 1);
  const maxDepth = matchedDepths.length ? Math.max(...matchedDepths) : 0;
  const avgDepth = matchedDepths.length
    ? matchedDepths.reduce((sum, depth) => sum + depth, 0) / matchedDepths.length
    : 0;
  const impassableRatio = impassableCount / denominator;
  const hasImpassableSegments = impassableCount > 0;
  const rainScale = clamp(rainfallMm / RAIN_SCALE_MM, 0, 1);

  const lowRatio = lowCount / denominator;
  const medRatio = medCount / denominator;
  const highRatio = highCount / denominator;

  const depthPenaltySeconds = clamp(
    rainScale * (lowRatio * 5 * 60 + medRatio * 12 * 60 + highRatio * 20 * 60),
    0,
    FLOOD_PENALTY_CAP_SEC
  );
  const passablePenaltySeconds = clamp(
    impassableRatio * rainScale * PASSABLE_RAIN_PENALTY_CAP_SEC,
    0,
    PASSABLE_RAIN_PENALTY_CAP_SEC
  );
  const penaltySeconds = clamp(
    depthPenaltySeconds + passablePenaltySeconds,
    0,
    FLOOD_PENALTY_CAP_SEC
  );

  const blockedByFlood =
    rainfallMm >= RAIN_VERY_HEAVY_MM &&
    (maxDepth >= FLOOD_BLOCK_DEPTH_M || impassableRatio >= FLOOD_BLOCK_IMPASSABLE_RATIO);

  return {
    depthForModel: clamp(avgDepth, 0, 3),
    maxDepth,
    penaltySeconds,
    blockedByFlood,
    impassableRatio,
    hasImpassableSegments,
  };
}
