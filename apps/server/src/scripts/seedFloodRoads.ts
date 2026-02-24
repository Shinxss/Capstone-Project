import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { FloodRoadSegment } from "../features/floodRoads/floodRoad.model";

function toNumberOrNull(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function toNumberOrUndefined(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function normalizeLineString(geom: any) {
  if (!geom || geom.type !== "LineString" || !Array.isArray(geom.coordinates)) return null;
  if (geom.coordinates.length < 2) return null;
  return { type: "LineString" as const, coordinates: geom.coordinates };
}

async function run() {
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/lifeline";

  await connectDB(mongoUri);

  const geojsonPath =
    process.env.ROAD_FLOOD_GEOJSON_PATH ||
    path.join(process.cwd(), "src", "data", "roads_flood_5yr_6k_column.geojson");

  const args = new Set(process.argv.slice(2));
  const shouldClear = args.has("--clear") || process.env.SEED_CLEAR === "1";
  const onlyKnown = args.has("--only-known") || process.env.SEED_ONLY_KNOWN === "1";

  if (shouldClear) {
    const res = await FloodRoadSegment.deleteMany({});
    console.log(`🧹 Cleared roads_flood_5yr: deleted ${res.deletedCount ?? 0}`);
  }

  const raw = fs.readFileSync(geojsonPath, "utf8");
  const fc = JSON.parse(raw);

  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    throw new Error("Invalid GeoJSON: expected FeatureCollection with features[]");
  }

  const BATCH = 500;
  let ops: any[] = [];
  let upserts = 0;
  let skipped = 0;

  for (const feature of fc.features) {
    const geometry = normalizeLineString(feature.geometry);
    if (!geometry) {
      skipped += 1;
      continue;
    }

    const props = (feature.properties ?? {}) as Record<string, unknown>;

    // From your QGIS output:
    // - full_id looks like "w28412383"
    // - osm_id is numeric-ish
    const full_id = typeof props.full_id === "string" ? props.full_id : undefined;
    const osm_id =
      toNumberOrUndefined(props.osm_id) ??
      (full_id?.startsWith("w") ? toNumberOrUndefined(full_id.slice(1)) : undefined);

    const osm_type = typeof props.osm_type === "string" ? props.osm_type : undefined;
    const highway = typeof props.highway === "string" ? props.highway : undefined;

    const csv_flood_depth_5yr = toNumberOrNull(props.csv_flood_depth_5yr);
    const csv_passable = toNumberOrNull(props.csv_passable);
    const csv_routing_cost = toNumberOrNull(props.csv_routing_cost);

    if (onlyKnown && csv_flood_depth_5yr === null) {
      skipped += 1;
      continue;
    }

    // Prefer stable filter keys for upsert
    const filter =
      typeof osm_id === "number"
        ? { osm_id }
        : typeof full_id === "string"
          ? { full_id }
          : null;

    if (!filter) {
      skipped += 1;
      continue;
    }

    const doc = {
      full_id,
      osm_id,
      osm_type,
      highway,
      csv_flood_depth_5yr,
      csv_passable,
      csv_routing_cost,
      geometry,
      rawProperties: props,
    };

    ops.push({
      updateOne: {
        filter,
        update: { $set: doc },
        upsert: true,
      },
    });

    if (ops.length >= BATCH) {
      const res = await FloodRoadSegment.bulkWrite(ops, { ordered: false });
      upserts += (res.upsertedCount ?? 0) + (res.modifiedCount ?? 0);
      ops = [];
      process.stdout.write(`⏳ seeded ~${upserts} (skipped ${skipped})...\r`);
    }
  }

  if (ops.length) {
    const res = await FloodRoadSegment.bulkWrite(ops, { ordered: false });
    upserts += (res.upsertedCount ?? 0) + (res.modifiedCount ?? 0);
  }

  // Ensure indexes exist (important esp. Atlas/production)
  await FloodRoadSegment.createIndexes();

  console.log(`\n✅ Flood roads seed done.`);
  console.log(`   Upserted/modified: ${upserts}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Collection: roads_flood_5yr`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ seedFloodRoads failed:", e);
  process.exit(1);
});