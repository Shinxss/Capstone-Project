# ai/src/routing-risk/preprocess.py
from __future__ import annotations

import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # ai/
ROADS = ROOT / "data" / "raw" / "roads_with_flood_5yr_with_routing_increased_accuracy.csv"
WEATHER = ROOT / "data" / "raw" / "dagupan_weather_level1.csv"
OUT = ROOT / "data" / "processed" / "routing-risk.training.csv"

# --- Calibrated weights (Leader update) ---
BASE_COST = 1.0
ROAD_PENALTY_LOW = 0.8     # low/no-info roads
ROAD_PENALTY_MED = 0.4     # medium roads
ROAD_PENALTY_HIGH = 0.0    # high roads
BRIDGE_PENALTY = 0.5
FLOOD_WEIGHT_RAINING = 1.5
RAINFALL_WEIGHT_RAINING = 0.1

def encode_road_priority(osm_type: str) -> int:
    """0=no_info, 1=low, 2=medium, 3=high (based on OSM highway type)."""
    if not isinstance(osm_type, str) or not osm_type.strip():
        return 0
    osm_type = osm_type.strip().lower()
    if osm_type in ["trunk", "primary"]:
        return 3
    if osm_type in ["secondary", "tertiary"]:
        return 2
    return 1

def compute_routing_cost(row) -> float:
    """Heuristic routing_cost used as training target.

    Goal: prefer safer roads when raining, but don't hard-block everything.
    The model later learns to approximate this cost from the 5 features.
    """
    cost = float(BASE_COST)

    # road priority penalty (reduced influence)
    rp = int(row["road_priority"])
    if rp <= 1:
        cost += ROAD_PENALTY_LOW
    elif rp == 2:
        cost += ROAD_PENALTY_MED
    else:
        cost += ROAD_PENALTY_HIGH

    # bridge penalty
    if int(row["bridge"]) == 1:
        cost += BRIDGE_PENALTY

    # weather-related penalties only when raining
    if int(row["is_raining"]) == 1:
        depth = float(row["flood_depth_5yr"])
        rain = float(row["rainfall_mm"])

        # Clamp for safety
        depth = max(0.0, min(3.0, depth))
        rain = max(0.0, min(200.0, rain))

        # IMPORTANT: if flood depth is 0 (no info / no hazard), don't let rainfall alone dominate.
        # This helps prevent "outside Dagupan = high risk" behavior if the depth feature is missing/zero.
        if depth > 0:
            cost += depth * FLOOD_WEIGHT_RAINING
            cost += rain * RAINFALL_WEIGHT_RAINING

    return float(cost)

def compute_passable_rule(row) -> int:
    """Optional: a binary passable label for analysis (NOT used for training by default).

    Keep it conservative; hard-block should still be decided by business rules.
    """
    rain = float(row["rainfall_mm"])
    depth = float(row["flood_depth_5yr"])

    if rain > 30 and depth > 0.3:
        return 0
    if rain > 10 and depth > 0.5:
        return 0
    return 1

def main():
    roads_df = pd.read_csv(ROADS)
    weather_df = pd.read_csv(WEATHER)

    # Cross join roads x weather rows (same as notebook approach)
    roads_df["__key"] = 1
    weather_df["__key"] = 1
    df = roads_df.merge(weather_df, on="__key").drop(columns=["__key"])

    # Basic cleanup / coercion
    df["flood_depth_5yr"] = pd.to_numeric(df.get("flood_depth_5yr", 0), errors="coerce").fillna(0.0).clip(0.0, 3.0)
    df["rainfall_mm"] = pd.to_numeric(df.get("rainfall_mm", 0), errors="coerce").fillna(0.0).clip(0.0, 200.0)
    df["is_raining"] = pd.to_numeric(df.get("is_raining", 0), errors="coerce").fillna(0).astype(int)
    df["is_raining"] = df["is_raining"].apply(lambda v: 1 if int(v) != 0 else 0)
    df["bridge"] = pd.to_numeric(df.get("bridge", 0), errors="coerce").fillna(0).astype(int)
    df["bridge"] = df["bridge"].apply(lambda v: 1 if int(v) != 0 else 0)

    # OSM road type -> priority bucket
    df["road_priority"] = df.get("type", "").apply(encode_road_priority).astype(int)

    # Training target
    df["routing_cost"] = df.apply(compute_routing_cost, axis=1)

    # Optional analysis labels
    df["passable_rule"] = df.apply(compute_passable_rule, axis=1)
    df["passable_cost5"] = df["routing_cost"].apply(lambda x: 0 if float(x) > 5 else 1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)

    print("✅ Wrote:", OUT)
    print("Rows:", len(df), "Cols:", len(df.columns))
    print("Sample cols:", ["flood_depth_5yr","rainfall_mm","is_raining","bridge","road_priority","routing_cost","passable_rule","passable_cost5"])

if __name__ == "__main__":
    main()
