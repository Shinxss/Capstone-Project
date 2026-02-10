import mapboxgl from "mapbox-gl";

const DRAFT_SOURCE_ID = "hazard-draft-src";
const DRAFT_FILL_ID = "hazard-draft-fill";
const DRAFT_LINE_ID = "hazard-draft-line";
const DRAFT_OUTLINE_ID = "hazard-draft-outline";
const DRAFT_POINTS_ID = "hazard-draft-points";

type LngLat = [number, number];

function emptyFC() {
  return { type: "FeatureCollection", features: [] as any[] };
}

export function ensureHazardDraftLayers(map: mapboxgl.Map) {
  // Source
  if (!map.getSource(DRAFT_SOURCE_ID)) {
    map.addSource(DRAFT_SOURCE_ID, {
      type: "geojson",
      data: emptyFC(),
    } as any);
  }

  // Points (vertices) — TOP MOST
  if (!map.getLayer(DRAFT_POINTS_ID)) {
    map.addLayer({
      id: DRAFT_POINTS_ID,
      type: "circle",
      source: DRAFT_SOURCE_ID,
      filter: ["==", ["get", "kind"], "draft-point"],
      paint: {
        "circle-radius": 7,
        "circle-color": "#60a5fa",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    } as any);
  }

  // Line (in-progress)
  if (!map.getLayer(DRAFT_LINE_ID)) {
    map.addLayer({
      id: DRAFT_LINE_ID,
      type: "line",
      source: DRAFT_SOURCE_ID,
      filter: ["==", ["get", "kind"], "draft-line"],
      paint: {
        "line-color": "#60a5fa",
        "line-width": 2,
        // dotted look like the sample image
        "line-dasharray": [1.2, 1.2],
        "line-opacity": 0.95,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    } as any);
  }

  // Outline for finished polygon
  if (!map.getLayer(DRAFT_OUTLINE_ID)) {
    map.addLayer({
      id: DRAFT_OUTLINE_ID,
      type: "line",
      source: DRAFT_SOURCE_ID,
      filter: ["==", ["get", "kind"], "draft-polygon"],
      paint: {
        "line-color": "#60a5fa",
        "line-width": 2,
        "line-dasharray": [1.2, 1.2],
        "line-opacity": 0.95,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    } as any);
  }

  // Fill (finished polygon)
  if (!map.getLayer(DRAFT_FILL_ID)) {
    map.addLayer({
      id: DRAFT_FILL_ID,
      type: "fill",
      source: DRAFT_SOURCE_ID,
      filter: ["==", ["get", "kind"], "draft-polygon"],
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.2,
      },
    } as any);
  }
}

export function setHazardDraftVisibility(map: mapboxgl.Map, visible: boolean) {
  const v = visible ? "visible" : "none";
  if (map.getLayer(DRAFT_FILL_ID)) map.setLayoutProperty(DRAFT_FILL_ID, "visibility", v);
  if (map.getLayer(DRAFT_OUTLINE_ID)) map.setLayoutProperty(DRAFT_OUTLINE_ID, "visibility", v);
  if (map.getLayer(DRAFT_LINE_ID)) map.setLayoutProperty(DRAFT_LINE_ID, "visibility", v);
  if (map.getLayer(DRAFT_POINTS_ID)) map.setLayoutProperty(DRAFT_POINTS_ID, "visibility", v);
}

export function clearHazardDraft(map: mapboxgl.Map) {
  const src = map.getSource(DRAFT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!src) return;
  src.setData(emptyFC() as any);
}

export function setHazardDraftData(map: mapboxgl.Map, points: LngLat[], closed: boolean) {
  const src = map.getSource(DRAFT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!src) return;

  const features: any[] = [];

  // points
  for (let i = 0; i < points.length; i++) {
    features.push({
      type: "Feature",
      properties: { kind: "draft-point", idx: i },
      geometry: { type: "Point", coordinates: points[i] },
    });
  }

  // line
  if (points.length >= 2) {
    features.push({
      type: "Feature",
      properties: { kind: "draft-line" },
      geometry: { type: "LineString", coordinates: points },
    });
  }

  // polygon
  if (closed && points.length >= 3) {
    const ring = [...points, points[0]];
    features.push({
      type: "Feature",
      properties: { kind: "draft-polygon" },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }

  src.setData({ type: "FeatureCollection", features } as any);
}
