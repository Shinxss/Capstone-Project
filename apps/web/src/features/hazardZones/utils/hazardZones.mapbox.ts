import mapboxgl from "mapbox-gl";
import type { HazardZone } from "../models/hazardZones.types";
import { HAZARD_TYPE_COLOR } from "../constants/hazardZones.constants";

const SOURCE_ID = "hazard-zones-src";

const FILL_ID = "hazard-zones-fill";
const OUTLINE_HALO_ID = "hazard-zones-outline-halo";
const OUTLINE_ID = "hazard-zones-outline";
const LABEL_ID = "hazard-zones-label";

type LngLat = [number, number];

function toNum(n: any) {
  const x = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(x) ? x : null;
}

function sameLngLat(a: LngLat, b: LngLat) {
  return a[0] === b[0] && a[1] === b[1];
}

function normalizeRing(ring: any[]): LngLat[] {
  if (!Array.isArray(ring)) return [];
  const pts: LngLat[] = [];

  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const lng = toNum(p[0]);
    const lat = toNum(p[1]);
    if (lng === null || lat === null) continue;
    pts.push([lng, lat]);
  }

  // need at least 3 points (+ closure)
  if (pts.length < 3) return [];

  // close ring if needed
  if (!sameLngLat(pts[0], pts[pts.length - 1])) {
    pts.push(pts[0]);
  }
  return pts;
}

function normalizeGeometry(g: any) {
  if (!g || typeof g !== "object") return null;
  if (g.type !== "Polygon" && g.type !== "MultiPolygon") return null;
  if (!Array.isArray(g.coordinates)) return null;

  if (g.type === "Polygon") {
    const rings = g.coordinates.map((ring: any) => normalizeRing(ring)).filter((r: any) => r.length >= 4);
    if (rings.length === 0) return null;
    return { type: "Polygon", coordinates: rings };
  }

  // MultiPolygon
  const polys = g.coordinates
    .map((poly: any) => {
      if (!Array.isArray(poly)) return null;
      const rings = poly.map((ring: any) => normalizeRing(ring)).filter((r: any) => r.length >= 4);
      return rings.length ? rings : null;
    })
    .filter(Boolean);

  if (polys.length === 0) return null;
  return { type: "MultiPolygon", coordinates: polys };
}

export function ensureHazardZonesLayers(map: mapboxgl.Map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    } as any);
  }

  // hazardType -> color
  const match: any[] = ["match", ["get", "hazardType"]];
  for (const [k, v] of Object.entries(HAZARD_TYPE_COLOR)) {
    match.push(k, v);
  }
  match.push("#eab308"); // fallback

  // Fill
  if (!map.getLayer(FILL_ID)) {
    map.addLayer({
      id: FILL_ID,
      type: "fill",
      source: SOURCE_ID,
      paint: {
        "fill-color": match,
        "fill-opacity": 0.35,
      },
    } as any);
  }

  // White halo outline (makes it visible on satellite)
  if (!map.getLayer(OUTLINE_HALO_ID)) {
    map.addLayer({
      id: OUTLINE_HALO_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "rgba(255,255,255,0.95)",
        "line-width": 6,
      },
    } as any);
  }

  // Colored outline
  if (!map.getLayer(OUTLINE_ID)) {
    map.addLayer({
      id: OUTLINE_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": match,
        "line-width": 3,
      },
    } as any);
  }

  // Labels (zone name)
  if (!map.getLayer(LABEL_ID)) {
    map.addLayer({
      id: LABEL_ID,
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "symbol-placement": "point",
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-offset": [0, 0],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.2,
      },
    } as any);
  }
}

export function setHazardZonesData(map: mapboxgl.Map, zones: HazardZone[]) {
  const src = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!src) return;

  const features = (zones ?? [])
    .map((z) => {
      const geom = normalizeGeometry((z as any).geometry);
      if (!geom) return null;

      return {
        type: "Feature",
        properties: {
          _id: z._id,
          hazardType: (z as any).hazardType,
          name: z.name,
        },
        geometry: geom,
      };
    })
    .filter(Boolean);

  src.setData({ type: "FeatureCollection", features } as any);
}

export function setHazardZonesVisibility(map: mapboxgl.Map, visible: boolean) {
  const v = visible ? "visible" : "none";
  if (map.getLayer(FILL_ID)) map.setLayoutProperty(FILL_ID, "visibility", v);
  if (map.getLayer(OUTLINE_HALO_ID)) map.setLayoutProperty(OUTLINE_HALO_ID, "visibility", v);
  if (map.getLayer(OUTLINE_ID)) map.setLayoutProperty(OUTLINE_ID, "visibility", v);
  if (map.getLayer(LABEL_ID)) map.setLayoutProperty(LABEL_ID, "visibility", v);
}
