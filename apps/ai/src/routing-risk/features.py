# apps/ai/src/routing-risk/features.py
import pandas as pd

FEATURES = ["flood_depth_5yr","rainfall_mm","is_raining","bridge","road_priority"]

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    # normalize bools
    out["is_raining"] = out["is_raining"].astype(int)
    out["bridge"] = out["bridge"].astype(int)

    # road_priority mapping (leader's rule)
    # 0 = no info, 1 = low, 2 = medium, 3 = high
    out["road_priority"] = out["road_priority"].fillna(0).astype(int)

    # numeric
    out["flood_depth_5yr"] = pd.to_numeric(out["flood_depth_5yr"], errors="coerce").fillna(0)
    out["rainfall_mm"] = pd.to_numeric(out["rainfall_mm"], errors="coerce").fillna(0)

    return out[FEATURES]