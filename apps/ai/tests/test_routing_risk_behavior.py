from __future__ import annotations

import time
from pathlib import Path

import numpy as np
import pandas as pd
import onnxruntime as ort


ROOT = Path(__file__).resolve().parents[1]
ONNX_PATH = ROOT / "models" / "routing-risk.onnx"

FEATURES = ["flood_depth_5yr", "rainfall_mm", "is_raining", "bridge", "road_priority"]


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["flood_depth_5yr"] = pd.to_numeric(out.get("flood_depth_5yr", 0), errors="coerce").fillna(0.0).clip(0.0, 3.0)
    out["rainfall_mm"] = pd.to_numeric(out.get("rainfall_mm", 0), errors="coerce").fillna(0.0).clip(0.0, 200.0)
    out["is_raining"] = pd.to_numeric(out.get("is_raining", 0), errors="coerce").fillna(0).astype(int)
    out["is_raining"] = out["is_raining"].apply(lambda v: 1 if int(v) != 0 else 0)

    b = out.get("bridge", 0)
    if getattr(b, "dtype", None) == object:
        out["bridge"] = (
            b.astype(str).str.strip().str.lower().map({"yes": 1, "true": 1, "1": 1}).fillna(0).astype(int)
        )
    else:
        out["bridge"] = pd.to_numeric(b, errors="coerce").fillna(0).astype(int)
    out["bridge"] = out["bridge"].apply(lambda v: 1 if int(v) != 0 else 0)

    out["road_priority"] = pd.to_numeric(out.get("road_priority", 0), errors="coerce").fillna(0).astype(int).clip(0, 3)

    return out[FEATURES]


def predict(session: ort.InferenceSession, rows: list[dict]) -> np.ndarray:
    df = pd.DataFrame(rows)
    X = prepare_features(df).astype(np.float32).to_numpy()
    input_name = session.get_inputs()[0].name
    return session.run(None, {input_name: X})[0].reshape(-1)


def main() -> None:
    session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])

    # 1) basic sanity
    scores = predict(session, [
        {"flood_depth_5yr": 0.0, "rainfall_mm": 0.0, "is_raining": 0, "bridge": 0, "road_priority": 3},
        {"flood_depth_5yr": 1.0, "rainfall_mm": 60.0, "is_raining": 1, "bridge": 0, "road_priority": 3},
    ])
    assert scores[1] > scores[0], "Flooded rainy road should score riskier than dry main road"

    # 2) bridge penalty should not help the score
    scores = predict(session, [
        {"flood_depth_5yr": 0.5, "rainfall_mm": 20.0, "is_raining": 1, "bridge": 0, "road_priority": 2},
        {"flood_depth_5yr": 0.5, "rainfall_mm": 20.0, "is_raining": 1, "bridge": 1, "road_priority": 2},
    ])
    assert scores[1] >= scores[0], "Bridge should not lower risk"

    # 3) lower road priority should not help the score
    scores = predict(session, [
        {"flood_depth_5yr": 0.5, "rainfall_mm": 20.0, "is_raining": 1, "bridge": 0, "road_priority": 3},
        {"flood_depth_5yr": 0.5, "rainfall_mm": 20.0, "is_raining": 1, "bridge": 0, "road_priority": 1},
    ])
    assert scores[1] >= scores[0], "Lower-priority road should not look safer than high-priority road"

    # 4) bad inputs should be sanitized, not crash
    scores = predict(session, [
        {"flood_depth_5yr": -10, "rainfall_mm": -5, "is_raining": -1, "bridge": "yes", "road_priority": 99},
        {"flood_depth_5yr": None, "rainfall_mm": None, "is_raining": None, "bridge": None, "road_priority": None},
    ])
    assert np.isfinite(scores).all(), "Sanitized bad inputs should still produce finite outputs"

    # 5) latency
    batch = [{
        "flood_depth_5yr": 0.8,
        "rainfall_mm": 35.0,
        "is_raining": 1,
        "bridge": 0,
        "road_priority": 2,
    }] * 1000

    start = time.perf_counter()
    _ = predict(session, batch)
    elapsed_ms = (time.perf_counter() - start) * 1000

    print("Batch latency (1000 rows):", round(elapsed_ms, 2), "ms")
    assert elapsed_ms < 2000, "Inference batch exceeded 2s budget"

    print("PASS: behavioral tests OK")


if __name__ == "__main__":
    main()