# ai/src/routing-risk/train.py
from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from features import FEATURES, prepare_features

ROOT = Path(__file__).resolve().parents[2]  # ai/
DATA = ROOT / "data" / "processed" / "routing-risk.training.csv"
OUT_MODEL = ROOT / "models" / "routing-risk.joblib"
OUT_META = ROOT / "models" / "routing-risk.meta.json"

# Risk labels (leader update) — useful for UI/debugging
RISK_THRESHOLDS = {
    "low_lt": 2.5,
    "medium_le": 5.0,   # medium is [2.5, 5.0]
    # high is > 5.0
}
SPEED_GUIDANCE_THRESHOLDS = {
    "normal_lt": 2.5,
    "caution_lt": 5.0,
    "slow_lt": 7.0,
    # extreme is >= 7.0
}

def main():
    df = pd.read_csv(DATA)

    # Training can be slow with full cross-join data.
    # Use MAX_ROWS to quickly retrain during development.
    # Set MAX_ROWS=0 to use all rows.
    max_rows = int(os.getenv("MAX_ROWS", "150000"))
    if max_rows > 0 and len(df) > max_rows:
        df = df.sample(n=max_rows, random_state=42).reset_index(drop=True)

    X = prepare_features(df)
    y = pd.to_numeric(df["routing_cost"], errors="coerce").fillna(0.0)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=int(os.getenv("N_ESTIMATORS", "60")),
        max_depth=int(os.getenv("MAX_DEPTH", "10")),
        min_samples_leaf=int(os.getenv("MIN_SAMPLES_LEAF", "3")),
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))

    OUT_MODEL.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, OUT_MODEL)

    meta = {
        "model": "routing-risk",
        "type": "regression",
        "features": FEATURES,
        "metrics": {"mae": mae},
        "training": {
            "rows_used": int(len(df)),
            "max_rows_env": max_rows,
            "n_estimators": model.n_estimators,
            "max_depth": model.max_depth,
            "min_samples_leaf": model.min_samples_leaf,
        },
        "encoding": {
            "road_priority": "0=no_info, 1=low, 2=medium, 3=high",
            "bridge": "0/1",
            "is_raining": "0/1",
        },
        "risk_thresholds": RISK_THRESHOLDS,
        "speed_guidance_thresholds": SPEED_GUIDANCE_THRESHOLDS,
        "notes": [
            "routing_cost is a soft risk score used to rank route alternatives.",
            "Avoid hard-blocking solely based on rainfall; only hard-block with strong flood evidence (e.g., high flood depth + heavy rain).",
            "If you have no flood-data coverage in an area, consider zeroing flood_depth_5yr (and optionally rainfall inputs) at inference time."
        ],
    }
    OUT_META.write_text(json.dumps(meta, indent=2))

    print("✅ trained:", OUT_MODEL)
    print("✅ meta:", OUT_META)
    print("MAE:", mae, "| rows used:", len(df))

if __name__ == "__main__":
    main()
