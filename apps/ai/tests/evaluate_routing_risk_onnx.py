from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import onnxruntime as ort

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    f1_score,
    classification_report,
)
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[1]  # ai/
MODEL_PATH = ROOT / "models" / "routing-risk.onnx"
META_PATH = ROOT / "models" / "routing-risk.meta.json"
DATA_PATH = ROOT / "data" / "processed" / "routing-risk.training.csv"


FEATURES = ["flood_depth_5yr", "rainfall_mm", "is_raining", "bridge", "road_priority"]
TARGET = "routing_cost"


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    out["flood_depth_5yr"] = pd.to_numeric(out.get("flood_depth_5yr", 0), errors="coerce").fillna(0.0)
    out["rainfall_mm"] = pd.to_numeric(out.get("rainfall_mm", 0), errors="coerce").fillna(0.0)

    out["flood_depth_5yr"] = out["flood_depth_5yr"].clip(lower=0.0, upper=3.0)
    out["rainfall_mm"] = out["rainfall_mm"].clip(lower=0.0, upper=200.0)

    out["is_raining"] = pd.to_numeric(out.get("is_raining", 0), errors="coerce").fillna(0).astype(int)
    out["is_raining"] = out["is_raining"].apply(lambda v: 1 if int(v) != 0 else 0)

    b = out.get("bridge", 0)
    if getattr(b, "dtype", None) == object:
        out["bridge"] = (
            b.astype(str)
            .str.strip()
            .str.lower()
            .map({"yes": 1, "true": 1, "1": 1})
            .fillna(0)
            .astype(int)
        )
    else:
        out["bridge"] = pd.to_numeric(b, errors="coerce").fillna(0).astype(int)
    out["bridge"] = out["bridge"].apply(lambda v: 1 if int(v) != 0 else 0)

    out["road_priority"] = pd.to_numeric(out.get("road_priority", 0), errors="coerce").fillna(0).astype(int)
    out["road_priority"] = out["road_priority"].clip(lower=0, upper=3)

    return out[FEATURES]


def to_risk_label(score: float) -> str:
    if score < 2.5:
        return "low"
    if score <= 5.0:
        return "medium"
    return "high"


def main() -> None:
    meta = json.loads(META_PATH.read_text())
    df = pd.read_csv(DATA_PATH)

    X = prepare_features(df)
    y = pd.to_numeric(df[TARGET], errors="coerce").fillna(0.0)

    # same split logic as training for consistency
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name

    X_onnx = X_test.astype(np.float32).to_numpy()
    y_pred = session.run(None, {input_name: X_onnx})[0].reshape(-1)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # optional classification-style reporting for defense
    y_true_cls = [to_risk_label(v) for v in y_test]
    y_pred_cls = [to_risk_label(v) for v in y_pred]

    acc = accuracy_score(y_true_cls, y_pred_cls)
    f1_macro = f1_score(y_true_cls, y_pred_cls, average="macro")

    results = {
        "model": meta.get("model"),
        "type": meta.get("type"),
        "features": meta.get("features"),
        "metrics": {
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "r2": float(r2),
            "derived_accuracy_3class": float(acc),
            "derived_f1_macro_3class": float(f1_macro),
        },
        "class_report_3class": classification_report(
            y_true_cls, y_pred_cls, output_dict=True
        ),
        "sample_count": int(len(X_test)),
    }

    out = ROOT / "models" / "routing-risk.eval.json"
    out.write_text(json.dumps(results, indent=2))

    print(json.dumps(results, indent=2))
    print(f"\nSaved to: {out}")


if __name__ == "__main__":
    main()