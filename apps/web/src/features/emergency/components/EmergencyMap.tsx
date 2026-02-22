import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";
import EmergencyMarker from "./EmergencyMarker";
import type { EmergencyType } from "../constants/emergency.constants";
import { toastWarning } from "@/services/feedback/toast.service";

export type MapEmergencyPin = {
  id: string;
  type: EmergencyType;
  lng: number;
  lat: number;
};

// ✅ Stable defaults (avoid new array identity on every render)
const DEFAULT_CENTER: [number, number] = [120.3333, 16.0431];

type Props = {
  reports: MapEmergencyPin[];
  heightClassName?: string;

  title?: string | null;
  legendVariant?: "legacy" | "byType";
  frame?: "card" | "full";

  showHeader?: boolean;
  showLocateButton?: boolean;

  onMapReady?: (map: mapboxgl.Map) => void;

  center?: [number, number];
  zoom?: number;
  mapStyle?: string;
  maxBounds?: mapboxgl.LngLatBoundsLike;

  /** Marker interaction */
  onPinClick?: (pin: MapEmergencyPin) => void;
  onMapClick?: (lng: number, lat: number) => void;

  /**
   * Optional Mapbox popup anchored to coordinates (Google Maps-like card).
   * Keep rendering responsibility in the parent; the map mounts it as a Mapbox Popup.
   */
  popup?: {
    lng: number;
    lat: number;
    content: ReactNode;
    onClose?: () => void;
  } | null;

  /** Additional styling hook for popup container */
  popupClassName?: string;

  /** Popup offset in pixels (how far above the marker) */
  popupOffset?: number;

  /**
   * Fit map view to markers.
   * - "always": every time reports change (default behavior)
   * - "initial": only on first non-empty load
   * - "never": never auto-fit
   */
  fitReports?: "always" | "initial" | "never";

  /** ✅ NEW: positions */
  navPosition?: mapboxgl.ControlPosition;
  attributionPosition?: mapboxgl.ControlPosition;
};

const safeUnmount = (root: Root) => {
  const run = () => {
    try {
      root.unmount();
    } catch {
      // ignore
    }
  };
  if (typeof queueMicrotask === "function") queueMicrotask(run);
  else setTimeout(run, 0);
};

export default function EmergencyMap({
  reports,
  heightClassName = "h-[420px]",
  title = "Emergency Map",
  legendVariant = "legacy",
  frame = "card",
  showHeader = true,
  showLocateButton = true,
  onMapReady,
  center = DEFAULT_CENTER,
  zoom = 13,
  mapStyle = "mapbox://styles/mapbox/satellite-streets-v12",
  maxBounds,
  onPinClick,
  onMapClick,
  popup = null,
  popupClassName,
  popupOffset = 18,
  fitReports = "always",
  navPosition = "top-right",
  attributionPosition = "bottom-right",
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; root: Root }[]>([]);
  const popupRef = useRef<{ popup: mapboxgl.Popup; root: Root } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const didInitialFitRef = useRef(false);

  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      toastWarning("Geolocation is not supported on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: Math.max(map.getZoom(), 14),
          speed: 1.2,
          essential: true,
        });
      },
      () => toastWarning("Unable to get your location. Please enable location permission."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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

  // ✅ IMPORTANT: prevent calling setStyle on first mount (causes your warning)
  const lastStyleRef = useRef<string | null>(null);
  const pendingStyleRef = useRef<string | null>(null);
  const styleSwitchScheduledRef = useRef(false);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      console.warn("Missing VITE_MAPBOX_TOKEN in .env");
      return;
    }
    mapboxgl.accessToken = token;

    const el = mapElRef.current;
    if (!el) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: el,
      style: mapStyle,
      center,
      zoom,
      attributionControl: false,
      ...(maxBounds ? { maxBounds } : {}),
    });

    // baseline style (so we won't setStyle again on mount)
    lastStyleRef.current = mapStyle;

    map.on("error", (e) => console.error("Mapbox error:", e?.error || e));

    // ✅ positions controlled by props
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), navPosition);
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), attributionPosition);

    map.on("load", () => {
      setLoaded(true);
      map.resize();
    });

    mapRef.current = map;
    onMapReady?.(map);

    requestAnimationFrame(() => map.resize());
    setTimeout(() => map.resize(), 150);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      markersRef.current.forEach(({ marker, root }) => {
        marker.remove();
        safeUnmount(root);
      });
      markersRef.current = [];

      if (popupRef.current) {
        popupRef.current.popup.remove();
        safeUnmount(popupRef.current.root);
        popupRef.current = null;
      }

      map.remove();
      mapRef.current = null;
      setLoaded(false);
      didInitialFitRef.current = false;
      lastStyleRef.current = null;
      pendingStyleRef.current = null;
      styleSwitchScheduledRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1], zoom, maxBounds, onMapReady, navPosition, attributionPosition]);

  // ✅ Optional Mapbox Popup (Google Maps-like card anchored to a coordinate)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    // Remove popup if parent cleared it
    if (!popup) {
      if (popupRef.current) {
        popupRef.current.popup.remove();
        safeUnmount(popupRef.current.root);
        popupRef.current = null;
      }
      return;
    }

    // Create once, then update location + content
    if (!popupRef.current) {
      const container = document.createElement("div");
      const root = createRoot(container);

      const p = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: popupOffset,
        className: `lifeline-map-popup ${popupClassName ?? ""}`.trim(),
      })
        .setLngLat([popup.lng, popup.lat])
        .setDOMContent(container)
        .addTo(map);

      // If Mapbox ever closes it (ESC), keep state in sync
      p.on("close", () => popup.onClose?.());

      popupRef.current = { popup: p, root };
    } else {
      popupRef.current.popup.setLngLat([popup.lng, popup.lat]);
      // offset can change
      try {
        popupRef.current.popup.setOffset(popupOffset as any);
      } catch {
        // ignore
      }
    }

    // Render latest React content. Stop propagation so map clicks don't close it.
    popupRef.current.root.render(
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {popup.content}
      </div>
    );
  }, [popup, loaded, popupClassName, popupOffset]);

  /**
   * ✅ v3-safe style switching:
   * - NEVER call setStyle while the style is still loading
   * - Queue the latest requested style and apply it only on map "idle"
   * This removes: "Unable to perform style diff: Style is not done loading..."
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    pendingStyleRef.current = mapStyle;

    // no changes
    if (mapStyle === lastStyleRef.current) return;

    const schedule = () => {
      const m = mapRef.current;
      if (!m) return;
      if (styleSwitchScheduledRef.current) return;

      styleSwitchScheduledRef.current = true;

      m.once("idle", () => {
        styleSwitchScheduledRef.current = false;

        const mm = mapRef.current;
        if (!mm) return;

        // must be fully loaded + style loaded
        if (!loaded || !mm.isStyleLoaded()) {
          schedule();
          return;
        }

        const next = pendingStyleRef.current;
        if (!next || next === lastStyleRef.current) return;

        try {
          lastStyleRef.current = next;
          mm.setStyle(next);
        } catch (err) {
          // if a race still happens, try again on next idle
          console.warn("setStyle failed, will retry on idle:", err);
          schedule();
          return;
        }

        // if user switched styles again while this was running, apply newest later
        schedule();
      });
    };

    schedule();
  }, [mapStyle, loaded]);

  // ✅ map click handler (always latest)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onMapClick) return;

    const handler = (ev: mapboxgl.MapMouseEvent) => {
      onMapClick(ev.lngLat.lng, ev.lngLat.lat);
    };

    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [onMapClick]);

  // markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    markersRef.current.forEach(({ marker, root }) => {
      marker.remove();
      safeUnmount(root);
    });
    markersRef.current = [];

    for (const r of reports) {
      if (!Number.isFinite(r.lng) || !Number.isFinite(r.lat)) continue;

      const el = document.createElement("div");
      const root = createRoot(el);
      root.render(<EmergencyMarker type={r.type} />);

      el.style.cursor = onPinClick ? "pointer" : "default";
      if (onPinClick) {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          onPinClick(r);
        });
      }

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([r.lng, r.lat])
        .addTo(map);

      markersRef.current.push({ marker, root });
    }

    const shouldFit =
      fitReports === "always" || (fitReports === "initial" && !didInitialFitRef.current);

    if (fitReports !== "never" && shouldFit && reports.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const r of reports) bounds.extend([r.lng, r.lat]);
      map.fitBounds(bounds, { padding: 110, maxZoom: 14.5, duration: 650 });
      didInitialFitRef.current = true;
    }
  }, [reports, loaded, onPinClick, fitReports]);

  const frameClass =
    frame === "full"
      ? "relative w-full h-full overflow-hidden"
      : "relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm dark:bg-[#0E1626] dark:border-[#162544]";

  return (
    <div className={frameClass}>
      <div ref={mapElRef} className={`w-full ${heightClassName}`} />

      {showHeader ? (
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between pointer-events-none">
          <div className="pointer-events-auto">
            {title ? (
              <div className="flex items-center gap-2 text-white font-semibold">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md">{title}</div>
              </div>
            ) : null}
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
      ) : null}

      {showLocateButton ? (
        <button
          onClick={handleLocateMe}
          className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-xs font-semibold px-3 py-2 rounded-md border border-gray-200 pointer-events-auto"
        >
          Locate Me
        </button>
      ) : null}
    </div>
  );
}
