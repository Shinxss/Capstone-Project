import path from "path";
import * as ort from "onnxruntime-node";

const MODEL_PATH = path.resolve(process.cwd(), "models", "routing-risk.onnx");

let sessionPromise: Promise<ort.InferenceSession> | null = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_PATH);
  }
  return sessionPromise;
}

export type RoutingRiskModelRow = {
  flood_depth_5yr: number;
  rainfall_mm: number;
  is_raining: 0 | 1;
  bridge: 0 | 1;
  road_priority: 0 | 1 | 2 | 3;
};

function toFeatureRow(row: RoutingRiskModelRow): number[] {
  return [
    row.flood_depth_5yr,
    row.rainfall_mm,
    row.is_raining,
    row.bridge,
    row.road_priority,
  ];
}

export async function predictRoutingRiskCosts(rows: RoutingRiskModelRow[]): Promise<number[]> {
  if (!rows.length) return [];

  const session = await getSession();
  const inputName = session.inputNames?.[0] ?? "float_input";
  const outputName = session.outputNames?.[0];

  const flattened = rows.flatMap(toFeatureRow);
  const inputTensor = new ort.Tensor("float32", Float32Array.from(flattened), [rows.length, 5]);
  const outputs = await session.run({ [inputName]: inputTensor });

  const resolvedOutputName =
    outputName && outputs[outputName] ? outputName : Object.keys(outputs)[0];

  if (!resolvedOutputName) {
    throw new Error("Routing risk model returned no outputs.");
  }

  const outputTensor = outputs[resolvedOutputName] as ort.Tensor;
  return Array.from(outputTensor.data as Float32Array).map((value) => Number(value));
}
