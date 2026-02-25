# ai/src/routing-risk/features.py
from __future__ import annotations

import pandas as pd

# Feature order MUST match the model input order used in export_onnx.py
FEATURES = ["flood_depth_5yr", "rainfall_mm", "is_raining", "bridge", "road_priority"]

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Validate + coerce raw columns into the exact numeric feature frame used by the model.

    Expected encoding:
      - road_priority: 0=no_info, 1=low, 2=medium, 3=high
      - bridge: 0/1
      - is_raining: 0/1
    """
    out = df.copy()

    # --- Numeric coercion / defaults ---
    out["flood_depth_5yr"] = pd.to_numeric(out.get("flood_depth_5yr", 0), errors="coerce").fillna(0.0)
    out["rainfall_mm"] = pd.to_numeric(out.get("rainfall_mm", 0), errors="coerce").fillna(0.0)

    # clamp to realistic ranges (keeps bad data from exploding predictions)
    out["flood_depth_5yr"] = out["flood_depth_5yr"].clip(lower=0.0, upper=3.0)
    out["rainfall_mm"] = out["rainfall_mm"].clip(lower=0.0, upper=200.0)

    # --- bool-like fields ---
    # is_raining can come as float/bool/string. Normalize to 0/1
    out["is_raining"] = pd.to_numeric(out.get("is_raining", 0), errors="coerce").fillna(0).astype(int)
    out["is_raining"] = out["is_raining"].apply(lambda v: 1 if int(v) != 0 else 0)

    # bridge can come as "yes"/"no", 1/0, True/False
    b = out.get("bridge", 0)
    if b.dtype == object:
        out["bridge"] = b.astype(str).str.strip().str.lower().map({"yes": 1, "true": 1, "1": 1}).fillna(0).astype(int)
    else:
        out["bridge"] = pd.to_numeric(b, errors="coerce").fillna(0).astype(int)
    out["bridge"] = out["bridge"].apply(lambda v: 1 if int(v) != 0 else 0)

    # --- categorical encoding ---
    out["road_priority"] = pd.to_numeric(out.get("road_priority", 0), errors="coerce").fillna(0).astype(int)
    out["road_priority"] = out["road_priority"].clip(lower=0, upper=3)

    return out[FEATURES]
