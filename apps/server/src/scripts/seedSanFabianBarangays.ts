import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { BarangayModel } from "../features/barangays/barangay.model";

// ---------- Helpers ----------
function pickName(props: any): string {
  if (!props) return "Unknown";

  const candidates = [
    "barangay", "Barangay", "BRGY", "brgy",
    "name", "Name", "NAME",
    "adm4_en", "ADM4_EN", "adm4", "ADM4",
    "loc_name", "LOC_NAME",
  ];

  for (const k of candidates) {
    const v = props[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  for (const [, v] of Object.entries(props)) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  return "Unknown";
}

function closeRing(coords: number[][]) {
  if (!coords?.length) return coords;
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
    const polys = geom.coordinates.map((poly: number[][][]) =>
      poly.map((ring: number[][]) => closeRing(ring))
    );
    return { type: "MultiPolygon" as const, coordinates: polys };
  }

  return null;
}

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/lifeline";
  await mongoose.connect(mongoUri);

  // ✅ Defaults for San Fabian
  const municipality = process.env.BARANGAY_CITY || "San Fabian";
  const province = process.env.BARANGAY_PROVINCE || "Pangasinan";

  // ✅ File path (override if needed)
  const geojsonPath =
    process.env.BARANGAY_GEOJSON_PATH ||
    path.join(process.cwd(), "src", "data", "san_fabian_barangays.geojson");

  const raw = fs.readFileSync(geojsonPath, "utf8");
  const fc = JSON.parse(raw);

  if (!fc?.features?.length) throw new Error("GeoJSON has no features.");

  let upserts = 0;
  let skipped = 0;

  for (const f of fc.features) {
    const geometry = normalizeGeometry(f.geometry);
    if (!geometry) {
      skipped++;
      continue;
    }

    const props = f.properties || {};
    const name = props.BRGY_NAME || props.brgy_name || props.ADM4_EN || props.NAME_4;


    const code = props.code || props.CODE || props.psgc || props.PSGC;

    await BarangayModel.updateOne(
      { name, city: municipality, province },
      {
        $set: {
          name,
          city: municipality,
          province,
          code: typeof code === "string" ? code : undefined,
          geometry,
          rawProperties: props,
        },
      },
      { upsert: true }
    );

    upserts++;
  }

  console.log(`✅ San Fabian seed done. Upserted ${upserts}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
