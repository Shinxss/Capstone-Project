import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # apps/ai
ROADS = ROOT / "data" / "raw" / "roads_with_flood_5yr_with_routing_increased_accuracy.csv"
WEATHER = ROOT / "data" / "raw" / "dagupan_weather_level1.csv"
OUT = ROOT / "data" / "processed" / "routing-risk.training.csv"

def encode_road_priority(osm_type: str) -> int:
    # leader mapping: 1=low, 2=medium, 3=high, 0=no info
    if not isinstance(osm_type, str) or not osm_type.strip():
        return 0
    osm_type = osm_type.strip().lower()
    if osm_type in ["trunk", "primary"]:
        return 3
    if osm_type in ["secondary", "tertiary"]:
        return 2
    return 1

def compute_routing_cost(row) -> float:
    cost = 1.0

    # road priority penalty: low roads get higher penalty
    rp = int(row["road_priority"])
    if rp <= 1:      # low / no info
        cost += 2
    elif rp == 2:    # medium
        cost += 1
    else:            # high
        cost += 0

    # bridge penalty (your roads csv already uses 0/1)
    if int(row["bridge"]) == 1:
        cost += 1

    # apply flood/rain penalties only when raining
    if int(row["is_raining"]) == 1:
        cost += float(row["flood_depth_5yr"]) * 1.0
        cost += float(row["rainfall_mm"]) * 0.1

    return cost

def main():
    roads_df = pd.read_csv(ROADS)
    weather_df = pd.read_csv(WEATHER)

    # cross join (same as notebook)
    roads_df["key"] = 1
    weather_df["key"] = 1
    df = roads_df.merge(weather_df, on="key").drop(columns=["key"])

    # features cleanup
    df["flood_depth_5yr"] = pd.to_numeric(df["flood_depth_5yr"], errors="coerce").fillna(0)
    df["rainfall_mm"] = pd.to_numeric(df["rainfall_mm"], errors="coerce").fillna(0)
    df["is_raining"] = pd.to_numeric(df["is_raining"], errors="coerce").fillna(0).astype(int)
    df["bridge"] = pd.to_numeric(df["bridge"], errors="coerce").fillna(0).astype(int)

    df["road_priority"] = df["type"].apply(encode_road_priority).astype(int)

    # recompute routing_cost so it really depends on rain/is_raining
    df["routing_cost"] = df.apply(compute_routing_cost, axis=1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)

    print("✅ Wrote:", OUT)
    print("Rows:", len(df), "Cols:", len(df.columns))
    print("Sample cols:", ["flood_depth_5yr","rainfall_mm","is_raining","bridge","road_priority","routing_cost"])

if __name__ == "__main__":
    main()