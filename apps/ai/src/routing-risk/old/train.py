# apps/ai/src/routing-risk/train.py
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib
from pathlib import Path
from features import prepare_features, FEATURES

ROOT = Path(__file__).resolve().parents[2]  # apps/ai
DATA = ROOT / "data" / "processed" / "routing-risk.training.csv"
OUT_MODEL = ROOT / "models" / "routing-risk.joblib"
OUT_META = ROOT / "models" / "routing-risk.meta.json"

def main():
    df = pd.read_csv(DATA)

    # TODO: make sure your merged dataset has: rainfall_mm, is_raining, road_priority columns
    # If not, merge with weather CSV first into processed dataset.

    X = prepare_features(df)
    y = pd.to_numeric(df["routing_cost"], errors="coerce").fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
    n_estimators=25,
    max_depth=6,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))

    joblib.dump(model, OUT_MODEL)

    meta = {
        "model": "routing-risk",
        "type": "regression",
        "features": FEATURES,
        "metrics": {"mae": mae},
        "encoding": {
            "road_priority": "0=no_info, 1=low, 2=medium, 3=high",
            "bridge": "0/1",
            "is_raining": "0/1"
        }
    }
    OUT_META.write_text(json.dumps(meta, indent=2))

    print("✅ trained:", OUT_MODEL)
    print("✅ meta:", OUT_META)
    print("MAE:", mae)

if __name__ == "__main__":
    main()