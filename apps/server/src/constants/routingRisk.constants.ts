export const ROUTING_RISK_DEFAULT_ONNX_PATH = "./models/routing-risk.onnx";
export const ROUTING_RISK_DEFAULT_META_PATH = "./models/routing-risk.meta.json";
export const ROUTING_RISK_DEFAULT_LOG_PATH = "./logs/routing-risk-inference.csv";

export const ROUTING_RISK_DEFAULT_FEATURE_ORDER = [
  "flood_depth_5yr",
  "rainfall_mm",
  "is_raining",
  "bridge",
  "road_priority",
] as const;

export type RoutingRiskFeatureName = (typeof ROUTING_RISK_DEFAULT_FEATURE_ORDER)[number];

export const ROUTING_RISK_INPUT_LIMITS = {
  flood_depth_5yr: { min: 0, max: 10 },
  rainfall_mm: { min: 0, max: 500 },
  is_raining: { min: 0, max: 1 },
  bridge: { min: 0, max: 1 },
  road_priority: { min: 0, max: 3 },
} as const;

export const ROUTING_RISK_DEFAULT_THRESHOLDS = {
  low_lt: 2.5,
  medium_le: 5.0,
} as const;

export const ROUTING_RISK_DEFAULT_SPEED_GUIDANCE = {
  normal_lt: 2.5,
  caution_lt: 5.0,
  slow_lt: 7.0,
} as const;
