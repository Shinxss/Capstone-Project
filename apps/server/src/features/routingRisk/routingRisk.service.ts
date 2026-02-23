import path from "path";
import * as ort from "onnxruntime-node";
import type { RoutingRiskRow } from "./routingRisk.schema";

const MODEL_PATH = path.resolve(process.cwd(), "models", "routing-risk.onnx");

// cache session so you don't reload model every request
let sessionPromise: Promise<ort.InferenceSession> | null = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_PATH);
  }
  return sessionPromise;
}

function toRowVector(r: RoutingRiskRow): number[] {
  // IMPORTANT: must match the model's training feature order
  return [
    r.flood_depth_5yr,
    r.rainfall_mm,
    r.is_raining,
    r.bridge,
    r.road_priority,
  ];
}

export async function predictRoutingCost(rows: RoutingRiskRow[]) {
  const session = await getSession();

  const inputName = session.inputNames?.[0] ?? "float_input"; // safe fallback
  const outputName = session.outputNames?.[0];

  const flattened = rows.flatMap(toRowVector);
  const inputTensor = new ort.Tensor(
    "float32",
    Float32Array.from(flattened),
    [rows.length, 5]
  );

  const outputs = await session.run({ [inputName]: inputTensor });

  if (!outputName || !outputs[outputName]) {
    // fallback if output name differs
    const firstKey = Object.keys(outputs)[0];
    const out = outputs[firstKey] as ort.Tensor;
    return Array.from(out.data as Float32Array);
  }

  const out = outputs[outputName] as ort.Tensor;
  return Array.from(out.data as Float32Array);
}