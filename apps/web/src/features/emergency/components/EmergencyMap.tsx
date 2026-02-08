import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";
import EmergencyMarker from "./EmergencyMarker";
import type { EmergencyType } from "../constants/emergency.constants";

export type MapEmergencyPin = {
  id: string;
  type: EmergencyType;
  lng: number;
  lat: number;
};

type Props = {
  reports: MapEmergencyPin[];
  heightClassName?: string;
  /** Overlay title (top-left). */
  title?: string;
  /**
   * "legacy" matches your original dashboard legend style (SOS / Fire / Other).
   * "byType" shows the top types dynamically.
   */
  legendVariant?: "legacy" | "byType";
};

// ✅ React 18 fix: avoid sync root.unmount() during an active render/commit
const safeUnmount = (root: Root) => {
  const run = () => {
    try {
      root.unmount();
    } catch {
      // ignore if already unmounted
    }
  };

  // Prefer microtask, fallback to macrotask
  if (typeof queueMicrotask === "function") queueMicrotask(run);
  else setTimeout(run, 0);
};

export default function EmergencyMap({
  reports,
  heightClassName = "h-[420px]",
  title = "Emergency Map (Dagupan)",
  legendVariant = "legacy",
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; root: Root }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: Math.max(map.getZoom(), 14),
          speed: 1.2,
        });
      },
      (err) => {
        console.warn("Geolocation error", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ✅ counts for legend chips
  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const r of reports) byType[r.type] = (byType[r.type] ?? 0) + 1;

    const sos = byType.SOS ?? 0;
    const fire = byType.FIRE ?? 0;
    const other = Object.entries(byType)
      .filter(([k]) => k !== "SOS" && k !== "FIRE")
      .reduce((acc, [, v]) => acc + (v ?? 0), 0);

    return { byType, sos, fire, other };
  }, [reports]);

  // init map once
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      console.warn("Missing VITE_MAPBOX_TOKEN in .env");
      return;
    }
    mapboxgl.accessToken = token;

    if (!mapElRef.current) return;
    if (mapRef.current) return;

    // ✅ fallback center (Dagupan)
    const DAGUPAN_CENTER: [number, number] = [120.3333, 16.0431];

    const map = new mapboxgl.Map({
      container: mapElRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: DAGUPAN_CENTER,
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => setLoaded(true));

    mapRef.current = map;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapElRef.current);

    return () => {
      ro.disconnect();

      markersRef.current.forEach(({ marker, root }) => {
        marker.remove();
        safeUnmount(root); // ✅ changed
      });
      markersRef.current = [];

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // render markers when reports change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    // clear old markers
    markersRef.current.forEach(({ marker, root }) => {
      marker.remove();
      safeUnmount(root); // ✅ changed
    });
    markersRef.current = [];

    // add new markers
    for (const r of reports) {
      if (!Number.isFinite(r.lng) || !Number.isFinite(r.lat)) continue;

      const el = document.createElement("div");
      const root = createRoot(el);
      root.render(<EmergencyMarker type={r.type} />);

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([r.lng, r.lat])
        .addTo(map);

      markersRef.current.push({ marker, root });
    }

    // fit view to pins
    if (reports.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const r of reports) bounds.extend([r.lng, r.lat]);
      map.fitBounds(bounds, { padding: 110, maxZoom: 14.5, duration: 650 });
    }
  }, [reports, loaded]);

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm dark:bg-[#0E1626] dark:border-[#162544]">
      <div ref={mapElRef} className={`w-full ${heightClassName}`} />

      {/* overlay header */}
      <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <div className="px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md">{title}</div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 mr-12">
          {legendVariant === "legacy" ? (
            <>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/30 text-xs font-semibold backdrop-blur-md">
                {counts.sos} SOS
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/30 text-xs font-semibold backdrop-blur-md">
                {counts.fire} Fire
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-md">
                {counts.other} Other
              </span>
            </>
          ) : (
            Object.entries(counts.byType)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .slice(0, 4)
              .map(([type, n]) => (
                <span
                  key={type}
                  className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-md"
                >
                  {n} {type}
                </span>
              ))
          )}
        </div>
      </div>

      <button
        onClick={handleLocateMe}
        className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-xs font-semibold px-3 py-2 rounded-md border border-gray-200 pointer-events-auto dark:bg-[#0E1626]/90 dark:hover:bg-[#122036] dark:text-slate-100 dark:border-[#162544]"
      >
        Locate Me
      </button>
    </div>
  );
}
