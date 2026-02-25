import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import * as ort from "onnxruntime-node";
import {
  ROUTING_RISK_DEFAULT_FEATURE_ORDER,
  ROUTING_RISK_DEFAULT_LOG_PATH,
  ROUTING_RISK_DEFAULT_META_PATH,
  ROUTING_RISK_DEFAULT_ONNX_PATH,
  ROUTING_RISK_DEFAULT_SPEED_GUIDANCE,
  ROUTING_RISK_DEFAULT_THRESHOLDS,
  ROUTING_RISK_INPUT_LIMITS,
  type RoutingRiskFeatureName,
} from "../../constants/routingRisk.constants";

export type RoutingRiskFeatureRow = {
  flood_depth_5yr: number;
  rainfall_mm: number;
  is_raining: 0 | 1;
  bridge: 0 | 1;
  road_priority: 0 | 1 | 2 | 3;
};

export type RoutingRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RoutingRiskThresholds = {
  low_lt: number;
  medium_le: number;
};

export type RoutingSpeedGuidanceThresholds = {
  normal_lt: number;
  caution_lt: number;
  slow_lt: number;
};

export type RoutingRiskPrediction = {
  routing_cost: number;
  risk_level: RoutingRiskLevel;
  recommended_speed_kph: number;
  model_available: boolean;
};

type RoutingRiskMeta = {
  featureOrder?: unknown;
  features?: unknown;
  risk_thresholds?: {
    low_lt?: unknown;
    medium_le?: unknown;
  };
  speed_guidance_thresholds?: {
    normal_lt?: unknown;
    caution_lt?: unknown;
    slow_lt?: unknown;
  };
};

type RoutingRiskConfig = {
  featureOrder: string[];
  riskThresholds: RoutingRiskThresholds;
  speedGuidanceThresholds: RoutingSpeedGuidanceThresholds;
};

type RoutingRiskModelContext = {
  available: boolean;
  reason?: string;
  session: ort.InferenceSession | null;
  inputName: string;
  outputName?: string;
  onnxPath: string;
  metaPath: string;
  config: RoutingRiskConfig;
};

const FALLBACK_COST = 0;
const LOG_HEADER =
  "timestamp,model_available,routing_cost,risk_level,recommended_speed_kph,flood_depth_5yr,rainfall_mm,is_raining,bridge,road_priority,feature_order";

let modelContextPromise: Promise<RoutingRiskModelContext> | null = null;
let unavailableWarned = false;
let logHeaderInitialized = false;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBinaryFlag(value: unknown): 0 | 1 {
  return toNumber(value, 0) >= 1 ? 1 : 0;
}

function toIntegerInRange(value: unknown, min: number, max: number): number {
  return Math.round(clamp(toNumber(value, min), min, max));
}

function isFeatureName(value: string): value is RoutingRiskFeatureName {
  return (ROUTING_RISK_DEFAULT_FEATURE_ORDER as readonly string[]).includes(value);
}

function toAbsolutePath(rawPath: string): string {
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
}

function resolvePaths() {
  const onnxPathRaw = process.env.ROUTING_RISK_ONNX_PATH?.trim() || ROUTING_RISK_DEFAULT_ONNX_PATH;
  const metaPathRaw = process.env.ROUTING_RISK_META_PATH?.trim() || ROUTING_RISK_DEFAULT_META_PATH;
  return {
    onnxPath: toAbsolutePath(onnxPathRaw),
    metaPath: toAbsolutePath(metaPathRaw),
  };
}

function resolveFeatureOrder(meta: RoutingRiskMeta): string[] {
  const candidate =
    (Array.isArray(meta.featureOrder) ? meta.featureOrder : null) ??
    (Array.isArray(meta.features) ? meta.features : null);

  if (!candidate?.length) {
    return [...ROUTING_RISK_DEFAULT_FEATURE_ORDER];
  }

  const values = candidate
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0);

  return values.length ? values : [...ROUTING_RISK_DEFAULT_FEATURE_ORDER];
}

function resolveRiskThresholds(meta: RoutingRiskMeta): RoutingRiskThresholds {
  const low_lt = toNumber(meta.risk_thresholds?.low_lt, ROUTING_RISK_DEFAULT_THRESHOLDS.low_lt);
  const medium_le = toNumber(
    meta.risk_thresholds?.medium_le,
    ROUTING_RISK_DEFAULT_THRESHOLDS.medium_le
  );

  return {
    low_lt: clamp(low_lt, 0, 999),
    medium_le: clamp(Math.max(medium_le, low_lt), 0, 999),
  };
}

function resolveSpeedGuidanceThresholds(meta: RoutingRiskMeta): RoutingSpeedGuidanceThresholds {
  const normal_lt = toNumber(
    meta.speed_guidance_thresholds?.normal_lt,
    ROUTING_RISK_DEFAULT_SPEED_GUIDANCE.normal_lt
  );
  const caution_lt = toNumber(
    meta.speed_guidance_thresholds?.caution_lt,
    ROUTING_RISK_DEFAULT_SPEED_GUIDANCE.caution_lt
  );
  const slow_lt = toNumber(
    meta.speed_guidance_thresholds?.slow_lt,
    ROUTING_RISK_DEFAULT_SPEED_GUIDANCE.slow_lt
  );

  return {
    normal_lt: clamp(normal_lt, 0, 999),
    caution_lt: clamp(Math.max(caution_lt, normal_lt), 0, 999),
    slow_lt: clamp(Math.max(slow_lt, caution_lt), 0, 999),
  };
}

function sanitizeRow(input: RoutingRiskFeatureRow): RoutingRiskFeatureRow {
  return {
    flood_depth_5yr: clamp(
      toNumber(input.flood_depth_5yr, 0),
      ROUTING_RISK_INPUT_LIMITS.flood_depth_5yr.min,
      ROUTING_RISK_INPUT_LIMITS.flood_depth_5yr.max
    ),
    rainfall_mm: clamp(
      toNumber(input.rainfall_mm, 0),
      ROUTING_RISK_INPUT_LIMITS.rainfall_mm.min,
      ROUTING_RISK_INPUT_LIMITS.rainfall_mm.max
    ),
    is_raining: toBinaryFlag(input.is_raining),
    bridge: toBinaryFlag(input.bridge),
    road_priority: toIntegerInRange(
      input.road_priority,
      ROUTING_RISK_INPUT_LIMITS.road_priority.min,
      ROUTING_RISK_INPUT_LIMITS.road_priority.max
    ) as 0 | 1 | 2 | 3,
  };
}

function getFeatureValue(row: RoutingRiskFeatureRow, feature: string): number {
  if (!isFeatureName(feature)) return 0;
  switch (feature) {
    case "flood_depth_5yr":
      return row.flood_depth_5yr;
    case "rainfall_mm":
      return row.rainfall_mm;
    case "is_raining":
      return row.is_raining;
    case "bridge":
      return row.bridge;
    case "road_priority":
      return row.road_priority;
    default:
      return 0;
  }
}

function warnModelUnavailable(reason: string) {
  if (unavailableWarned) return;
  unavailableWarned = true;
  console.warn(`[routing-risk] ONNX inference disabled: ${reason}`);
}

async function loadMetaConfig(metaPath: string): Promise<RoutingRiskConfig> {
  const fallback: RoutingRiskConfig = {
    featureOrder: [...ROUTING_RISK_DEFAULT_FEATURE_ORDER],
    riskThresholds: { ...ROUTING_RISK_DEFAULT_THRESHOLDS },
    speedGuidanceThresholds: { ...ROUTING_RISK_DEFAULT_SPEED_GUIDANCE },
  };

  if (!fs.existsSync(metaPath)) {
    console.warn(`[routing-risk] meta not found at ${metaPath}. Using defaults.`);
    return fallback;
  }

  try {
    const raw = await fsPromises.readFile(metaPath, "utf8");
    const parsed = JSON.parse(raw) as RoutingRiskMeta;
    return {
      featureOrder: resolveFeatureOrder(parsed),
      riskThresholds: resolveRiskThresholds(parsed),
      speedGuidanceThresholds: resolveSpeedGuidanceThresholds(parsed),
    };
  } catch (error) {
    console.warn(
      `[routing-risk] failed to read/parse meta at ${metaPath}. Using defaults. Reason: ${
        (error as Error).message
      }`
    );
    return fallback;
  }
}

async function initializeModelContext(): Promise<RoutingRiskModelContext> {
  const { onnxPath, metaPath } = resolvePaths();
  const config = await loadMetaConfig(metaPath);

  if (!fs.existsSync(onnxPath)) {
    return {
      available: false,
      reason: `Model file not found at ${onnxPath}`,
      session: null,
      inputName: "float_input",
      outputName: undefined,
      onnxPath,
      metaPath,
      config,
    };
  }

  try {
    const session = await ort.InferenceSession.create(onnxPath);
    return {
      available: true,
      session,
      inputName: session.inputNames?.[0] ?? "float_input",
      outputName: session.outputNames?.[0],
      onnxPath,
      metaPath,
      config,
    };
  } catch (error) {
    return {
      available: false,
      reason: (error as Error).message,
      session: null,
      inputName: "float_input",
      outputName: undefined,
      onnxPath,
      metaPath,
      config,
    };
  }
}

async function getModelContext(): Promise<RoutingRiskModelContext> {
  if (!modelContextPromise) {
    modelContextPromise = initializeModelContext();
  }
  return modelContextPromise;
}

function toRiskLevel(cost: number, thresholds: RoutingRiskThresholds): RoutingRiskLevel {
  if (cost < thresholds.low_lt) return "LOW";
  if (cost <= thresholds.medium_le) return "MEDIUM";
  return "HIGH";
}

function toRecommendedSpeedKph(cost: number, thresholds: RoutingSpeedGuidanceThresholds): number {
  if (cost < thresholds.normal_lt) return 45;
  if (cost < thresholds.caution_lt) return 35;
  if (cost < thresholds.slow_lt) return 25;
  return 15;
}

function shouldLogRoutingRisk(): boolean {
  return process.env.LOG_ROUTING_RISK === "1";
}

function resolveLogPath(): string {
  const raw = process.env.ROUTING_RISK_LOG_PATH?.trim() || ROUTING_RISK_DEFAULT_LOG_PATH;
  return toAbsolutePath(raw);
}

async function ensureLogHeader(logPath: string): Promise<void> {
  if (logHeaderInitialized) return;

  const directory = path.dirname(logPath);
  await fsPromises.mkdir(directory, { recursive: true });

  if (!fs.existsSync(logPath)) {
    await fsPromises.writeFile(logPath, `${LOG_HEADER}\n`, "utf8");
  }

  logHeaderInitialized = true;
}

function toLogCsvLine(input: {
  timestamp: string;
  modelAvailable: boolean;
  prediction: RoutingRiskPrediction;
  row: RoutingRiskFeatureRow;
  featureOrder: string[];
}): string {
  const ordered = input.featureOrder.join("|");
  return [
    input.timestamp,
    input.modelAvailable ? "1" : "0",
    input.prediction.routing_cost.toFixed(6),
    input.prediction.risk_level,
    String(input.prediction.recommended_speed_kph),
    input.row.flood_depth_5yr.toFixed(6),
    input.row.rainfall_mm.toFixed(6),
    String(input.row.is_raining),
    String(input.row.bridge),
    String(input.row.road_priority),
    ordered,
  ].join(",");
}

async function maybeAppendPredictionLog(input: {
  rows: RoutingRiskFeatureRow[];
  predictions: RoutingRiskPrediction[];
  modelAvailable: boolean;
  featureOrder: string[];
}): Promise<void> {
  if (!shouldLogRoutingRisk()) return;

  try {
    const logPath = resolveLogPath();
    await ensureLogHeader(logPath);

    const timestamp = new Date().toISOString();
    const lines: string[] = [];

    for (let i = 0; i < input.rows.length; i += 1) {
      const row = input.rows[i];
      const prediction = input.predictions[i];
      if (!row || !prediction) continue;
      lines.push(
        toLogCsvLine({
          timestamp,
          modelAvailable: input.modelAvailable,
          prediction,
          row,
          featureOrder: input.featureOrder,
        })
      );
    }

    if (lines.length) {
      await fsPromises.appendFile(logPath, `${lines.join("\n")}\n`, "utf8");
    }
  } catch (error) {
    console.warn(`[routing-risk] failed to append CSV log: ${(error as Error).message}`);
  }
}

function buildPredictions(
  input: {
    rows: RoutingRiskFeatureRow[];
    costs: number[];
    modelAvailable: boolean;
    config: RoutingRiskConfig;
  }
): RoutingRiskPrediction[] {
  const predictions: RoutingRiskPrediction[] = [];

  for (let i = 0; i < input.rows.length; i += 1) {
    const cost = toNumber(input.costs[i], FALLBACK_COST);
    const riskLevel = toRiskLevel(cost, input.config.riskThresholds);
    predictions.push({
      routing_cost: cost,
      risk_level: riskLevel,
      recommended_speed_kph: toRecommendedSpeedKph(cost, input.config.speedGuidanceThresholds),
      model_available: input.modelAvailable,
    });
  }

  return predictions;
}

export async function getRoutingRiskConfig() {
  const context = await getModelContext();
  return {
    available: context.available,
    reason: context.reason,
    featureOrder: [...context.config.featureOrder],
    riskThresholds: { ...context.config.riskThresholds },
    speedGuidanceThresholds: { ...context.config.speedGuidanceThresholds },
    onnxPath: context.onnxPath,
    metaPath: context.metaPath,
  };
}

export async function predictRoutingRiskCosts(
  rows: RoutingRiskFeatureRow[]
): Promise<RoutingRiskPrediction[]> {
  if (!rows.length) return [];

  const sanitizedRows = rows.map(sanitizeRow);
  const context = await getModelContext();

  if (!context.available || !context.session) {
    warnModelUnavailable(context.reason ?? "Unknown initialization failure");
    const fallbackCosts = sanitizedRows.map(() => FALLBACK_COST);
    const fallbackPredictions = buildPredictions({
      rows: sanitizedRows,
      costs: fallbackCosts,
      modelAvailable: false,
      config: context.config,
    });
    await maybeAppendPredictionLog({
      rows: sanitizedRows,
      predictions: fallbackPredictions,
      modelAvailable: false,
      featureOrder: context.config.featureOrder,
    });
    return fallbackPredictions;
  }

  const featureOrder = context.config.featureOrder;
  const tensorData = new Float32Array(sanitizedRows.length * featureOrder.length);

  let cursor = 0;
  for (const row of sanitizedRows) {
    for (const feature of featureOrder) {
      tensorData[cursor] = getFeatureValue(row, feature);
      cursor += 1;
    }
  }

  try {
    const inputTensor = new ort.Tensor("float32", tensorData, [
      sanitizedRows.length,
      featureOrder.length,
    ]);
    const outputs = await context.session.run({ [context.inputName]: inputTensor });
    const resolvedOutputName =
      context.outputName && outputs[context.outputName]
        ? context.outputName
        : Object.keys(outputs)[0];

    if (!resolvedOutputName) {
      throw new Error("Routing risk model returned no outputs.");
    }

    const outputTensor = outputs[resolvedOutputName] as ort.Tensor;
    const rawOutput = Array.from(outputTensor.data as ArrayLike<number>).map((value) =>
      toNumber(value, FALLBACK_COST)
    );

    const predictions = buildPredictions({
      rows: sanitizedRows,
      costs: rawOutput,
      modelAvailable: true,
      config: context.config,
    });

    await maybeAppendPredictionLog({
      rows: sanitizedRows,
      predictions,
      modelAvailable: true,
      featureOrder: featureOrder,
    });

    return predictions;
  } catch (error) {
    warnModelUnavailable((error as Error).message);
    const fallbackCosts = sanitizedRows.map(() => FALLBACK_COST);
    const fallbackPredictions = buildPredictions({
      rows: sanitizedRows,
      costs: fallbackCosts,
      modelAvailable: false,
      config: context.config,
    });

    await maybeAppendPredictionLog({
      rows: sanitizedRows,
      predictions: fallbackPredictions,
      modelAvailable: false,
      featureOrder: featureOrder,
    });

    return fallbackPredictions;
  }
}

export async function predictRoutingCost(rows: RoutingRiskFeatureRow[]): Promise<number[]> {
  const predictions = await predictRoutingRiskCosts(rows);
  return predictions.map((item) => item.routing_cost);
}
