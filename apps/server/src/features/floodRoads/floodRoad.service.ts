import { FloodRoad, type GeoJSONLineString } from "./floodRoad.model";
import {
  FLOOD_HARD_BLOCK_DEPTH_M,
  FLOOD_MIN_COVERAGE_POINTS,
  FLOOD_NEAR_DISTANCE_M,
  FLOOD_PASSABLE_DEPTH_MAX_M,
  FLOOD_PASSABLE_RAIN_PENALTY_CAP_SEC,
  FLOOD_PENALTY_CAP_SEC,
  FLOOD_RAIN_SCALE_MM,
  FLOOD_SAMPLE_POINTS,
} from "../../constants/floodRouting.constants";

export type LineStringGeometry = GeoJSONLineString;

export type RoutingWeatherInput = {
  rainfall_mm: number;
  is_raining: 0 | 1;
};

export type FloodCoverageStats = {
  samplePointCount: number;
  matchedPointCount: number;
  hasCoverage: boolean;
};

export type FloodRouteStats = {
  depthForModel: number;
  avgDepth: number;
  maxDepth: number;
  penaltySeconds: number;
  blockedByFlood: boolean;
  impassableRatio: number;
  hasImpassableSegments: boolean;
  coverage: FloodCoverageStats;
};

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

function getNoFloodStats(coverage: FloodCoverageStats): FloodRouteStats {
  return {
    depthForModel: 0,
    avgDepth: 0,
    maxDepth: 0,
    penaltySeconds: 0,
    blockedByFlood: false,
    impassableRatio: 0,
    hasImpassableSegments: false,
    coverage,
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
} | null;

async function findNearbyFloodRoadByPoint(
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

  const nearestAny = (await FloodRoad.find({
    geometry: nearCondition,
  } as any)
    .select("csv_flood_depth_5yr")
    .limit(5)
    .lean()) as Array<{ csv_flood_depth_5yr?: number | null }>;

  if (!nearestAny.length) {
    cache.set(pointKey, null);
    return null;
  }

  let maxDepth: number | null = null;
  for (const item of nearestAny) {
    const depth = toNonNegativeNumber(item?.csv_flood_depth_5yr);
    if (depth === null) continue;
    if (maxDepth === null || depth > maxDepth) {
      maxDepth = depth;
    }
  }

  const normalizedMatch: FloodRoadMatch =
    maxDepth === null
      ? null
      : {
          csv_flood_depth_5yr: maxDepth,
        };

  cache.set(pointKey, normalizedMatch);
  return normalizedMatch;
}

export async function computeFloodStatsForRoute(
  route: LineStringGeometry,
  weather: RoutingWeatherInput
): Promise<FloodRouteStats> {
  const samplePoints = sampleRoutePoints(route.coordinates, FLOOD_SAMPLE_POINTS);
  if (!samplePoints.length) {
    return getNoFloodStats({
      samplePointCount: 0,
      matchedPointCount: 0,
      hasCoverage: false,
    });
  }

  const lookupCache = new Map<string, FloodRoadMatch>();
  const nearestMatches = await Promise.all(
    samplePoints.map((point) => findNearbyFloodRoadByPoint(point, lookupCache))
  );
  const matchedPointCount = nearestMatches.reduce((count, match) => (match ? count + 1 : count), 0);

  const coverage: FloodCoverageStats = {
    samplePointCount: samplePoints.length,
    matchedPointCount,
    hasCoverage: matchedPointCount >= FLOOD_MIN_COVERAGE_POINTS,
  };

  if (matchedPointCount <= 0) {
    return getNoFloodStats(coverage);
  }

  const matchedDepths: number[] = [];
  let cautionCount = 0;
  let highRiskCount = 0;
  let hardBlockCount = 0;

  for (const match of nearestMatches) {
    const depth = toNonNegativeNumber(match?.csv_flood_depth_5yr);
    if (depth !== null) {
      matchedDepths.push(depth);
      if (depth >= FLOOD_HARD_BLOCK_DEPTH_M) {
        hardBlockCount += 1;
        continue;
      }

      if (depth > FLOOD_PASSABLE_DEPTH_MAX_M) {
        highRiskCount += 1;
        continue;
      }

      if (depth > 0) {
        cautionCount += 1;
      }
    }
  }

  const denominator = Math.max(matchedPointCount, 1);
  const maxDepth = matchedDepths.length ? Math.max(...matchedDepths) : 0;
  const avgDepth = matchedDepths.length
    ? matchedDepths.reduce((sum, depth) => sum + depth, 0) / matchedDepths.length
    : 0;
  const impassableCount = highRiskCount + hardBlockCount;
  const impassableRatio = impassableCount / denominator;
  const hasImpassableSegments = impassableCount > 0;

  const rainfallMm = toNonNegativeNumber(weather.rainfall_mm) ?? 0;
  const hasActiveRain = weather.is_raining === 1;
  const rainScale = hasActiveRain ? clamp(rainfallMm / FLOOD_RAIN_SCALE_MM, 0, 1) : 0;

  const lowRatio = cautionCount / denominator;
  const medRatio = highRiskCount / denominator;
  const highRatio = hardBlockCount / denominator;

  const rawDepthPenaltySeconds = clamp(
    rainScale * (lowRatio * 5 * 60 + medRatio * 12 * 60 + highRatio * 20 * 60),
    0,
    FLOOD_PENALTY_CAP_SEC
  );
  const rawPassablePenaltySeconds = clamp(
    impassableRatio * rainScale * FLOOD_PASSABLE_RAIN_PENALTY_CAP_SEC,
    0,
    FLOOD_PASSABLE_RAIN_PENALTY_CAP_SEC
  );
  const penaltySeconds = coverage.hasCoverage
    ? clamp(
        rawDepthPenaltySeconds + rawPassablePenaltySeconds,
        0,
        FLOOD_PENALTY_CAP_SEC
      )
    : 0;

  const blockedByFlood = coverage.hasCoverage && hasActiveRain && hardBlockCount > 0;

  return {
    depthForModel: coverage.hasCoverage ? clamp(avgDepth, 0, 3) : 0,
    avgDepth,
    maxDepth,
    penaltySeconds,
    blockedByFlood,
    impassableRatio,
    hasImpassableSegments,
    coverage,
  };
}
