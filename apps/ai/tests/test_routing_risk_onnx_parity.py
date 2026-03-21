from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import onnxruntime as ort


ROOT = Path(__file__).resolve().parents[1]
JOBLIB_PATH = ROOT / "models" / "routing-risk.joblib"
ONNX_PATH = ROOT / "models" / "routing-risk.onnx"
DATA_PATH = ROOT / "data" / "processed" / "routing-risk.training.csv"

FEATURES = ["flood_depth_5yr", "rainfall_mm", "is_raining", "bridge", "road_priority"]


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["flood_depth_5yr"] = pd.to_numeric(out.get("flood_depth_5yr", 0), errors="coerce").fillna(0.0).clip(0.0, 3.0)
    out["rainfall_mm"] = pd.to_numeric(out.get("rainfall_mm", 0), errors="coerce").fillna(0.0).clip(0.0, 200.0)
    out["is_raining"] = pd.to_numeric(out.get("is_raining", 0), errors="coerce").fillna(0).astype(int)
    out["is_raining"] = out["is_raining"].apply(lambda v: 1 if int(v) != 0 else 0)
    out["bridge"] = pd.to_numeric(out.get("bridge", 0), errors="coerce").fillna(0).astype(int)
    out["bridge"] = out["bridge"].apply(lambda v: 1 if int(v) != 0 else 0)
    out["road_priority"] = pd.to_numeric(out.get("road_priority", 0), errors="coerce").fillna(0).astype(int).clip(0, 3)
    return out[FEATURES]


def main() -> None:
    df = pd.read_csv(DATA_PATH).sample(n=200, random_state=42)
    X = prepare_features(df)

    skl_model = joblib.load(JOBLIB_PATH)
    skl_pred = skl_model.predict(X)

    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    onnx_pred = session.run(None, {input_name: X.astype(np.float32).to_numpy()})[0].reshape(-1)

    max_abs_diff = float(np.max(np.abs(skl_pred - onnx_pred)))
    mean_abs_diff = float(np.mean(np.abs(skl_pred - onnx_pred)))

    print("max_abs_diff:", max_abs_diff)
    print("mean_abs_diff:", mean_abs_diff)

    assert max_abs_diff < 1e-4, "ONNX output differs too much from joblib model"
    print("PASS: ONNX parity OK")


if __name__ == "__main__":
    main()