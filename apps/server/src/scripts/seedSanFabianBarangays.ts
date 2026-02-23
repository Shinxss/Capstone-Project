import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { BarangayModel } from "../features/barangays/barangay.model";

function pickName(props: Record<string, unknown> | null | undefined): string {
  if (!props) return "Unknown";

  const candidates = [
    "BRGY_NAME",
    "brgy_name",
    "ADM4_EN",
    "NAME_4",
    "barangay",
    "Barangay",
    "BRGY",
    "brgy",
    "name",
    "Name",
    "NAME",
  ];

  for (const key of candidates) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  for (const value of Object.values(props)) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "Unknown";
}

function closeRing(coords: number[][]) {
  if (!coords.length) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first]);
  return coords;
}

function normalizeGeometry(geom: any) {
  if (!geom?.type || !geom?.coordinates) return null;

  if (geom.type === "Polygon") {
    const rings = geom.coordinates.map((ring: number[][]) => closeRing(ring));
    return { type: "Polygon" as const, coordinates: rings };
  }

  if (geom.type === "MultiPolygon") {
    const polygons = geom.coordinates.map((polygon: number[][][]) =>
      polygon.map((ring: number[][]) => closeRing(ring))
    );
    return { type: "MultiPolygon" as const, coordinates: polygons };
  }

  return null;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/lifeline";
  await mongoose.connect(mongoUri);

  const municipality = process.env.BARANGAY_CITY || "San Fabian";
  const province = process.env.BARANGAY_PROVINCE || "Pangasinan";

  const geojsonPath =
    process.env.BARANGAY_GEOJSON_PATH ||
    path.join(process.cwd(), "src", "data", "san_fabian_barangays.geojson");

  const raw = fs.readFileSync(geojsonPath, "utf8");
  const featureCollection = JSON.parse(raw);

  if (!featureCollection?.features?.length) {
    throw new Error("GeoJSON has no features.");
  }

  let upserts = 0;
  let skipped = 0;

  for (const feature of featureCollection.features) {
    const geometry = normalizeGeometry(feature.geometry);
    if (!geometry) {
      skipped += 1;
      continue;
    }

    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const name = pickName(props);
    const code = props.code || props.CODE || props.psgc || props.PSGC;

    await BarangayModel.updateOne(
      { name, city: municipality, province },
      {
        $set: {
          name,
          city: municipality,
          province,
          code: typeof code === "string" ? code : undefined,
          isActive: true,
          geometry,
          rawProperties: props,
        },
      },
      { upsert: true }
    );

    upserts += 1;
  }

  console.log(`San Fabian barangay seed done. Upserted ${upserts}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("San Fabian barangay seed failed:", error);
  process.exit(1);
});
