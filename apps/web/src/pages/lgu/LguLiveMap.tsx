import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import LguShell from "../../components/lgu/LguShell";
import {
  MapPin,
  Layers,
  LocateFixed,
  Siren,
  Droplet,
  Flame,
  Wind,
  Zap,
  Building2,
  Users,
  Search,
  RefreshCcw,
} from "lucide-react";

type EmergencyType = "SOS" | "Flood" | "Fire" | "Typhoon" | "Earthquake" | "Collapse";
type Severity = "critical" | "high" | "medium" | "low";
type VolunteerStatus = "available" | "busy" | "offline";

type Emergency = {
  id: string;
  type: EmergencyType;
  severity: Severity;
  title: string;
  locationLabel: string;
  lng: number;
  lat: number;
  timeAgo: string;
};

type Volunteer = {
  id: string;
  name: string;
  status: VolunteerStatus;
  lng: number;
  lat: number;
  skill: string;
};

function iconForType(type: EmergencyType) {
  switch (type) {
    case "SOS":
      return Siren;
    case "Flood":
      return Droplet;
    case "Fire":
      return Flame;
    case "Typhoon":
      return Wind;
    case "Earthquake":
      return Zap;
    case "Collapse":
      return Building2;
    default:
      return MapPin;
  }
}

function colorForSeverity(sev: Severity) {
  switch (sev) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#a855f7";
    case "low":
      return "#22c55e";
    default:
      return "#64748b";
  }
}

function colorForVolunteerStatus(s: VolunteerStatus) {
  switch (s) {
    case "available":
      return "#22c55e";
    case "busy":
      return "#f97316";
    case "offline":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

export default function LguLiveMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const emergencyMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const volunteerMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const meMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [query, setQuery] = useState("");

  // Dagupan City focus (approx)
  const DAGUPAN_CENTER: [number, number] = [120.34, 16.043];

  const emergencies: Emergency[] = useMemo(
    () => [
      {
        id: "e1",
        type: "SOS",
        severity: "critical",
        title: "SOS Emergency",
        locationLabel: "Dagupan City Center",
        lng: 120.3408,
        lat: 16.0438,
        timeAgo: "2 min ago",
      },
      {
        id: "e2",
        type: "Flood",
        severity: "high",
        title: "Road Flooding",
        locationLabel: "Arellano St, Dagupan",
        lng: 120.3336,
        lat: 16.0449,
        timeAgo: "12 min ago",
      },
      {
        id: "e3",
        type: "Fire",
        severity: "medium",
        title: "Residential Fire Report",
        locationLabel: "Tapuac Area, Dagupan",
        lng: 120.3494,
        lat: 16.0406,
        timeAgo: "25 min ago",
      },
      {
        id: "e4",
        type: "Collapse",
        severity: "low",
        title: "Minor Structure Damage",
        locationLabel: "Bonuan Area, Dagupan",
        lng: 120.3046,
        lat: 16.0552,
        timeAgo: "1 hr ago",
      },
    ],
    []
  );

  const volunteers: Volunteer[] = useMemo(
    () => [
      {
        id: "v1",
        name: "Juan Dela Cruz",
        status: "available",
        lng: 120.3451,
        lat: 16.0417,
        skill: "First Aid",
      },
      {
        id: "v2",
        name: "Maria Santos",
        status: "busy",
        lng: 120.3369,
        lat: 16.0471,
        skill: "Rescue",
      },
      {
        id: "v3",
        name: "Karlo Sison",
        status: "offline",
        lng: 120.3222,
        lat: 16.051,
        skill: "Logistics",
      },
    ],
    []
  );

  const filteredEmergencies = emergencies.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.locationLabel.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    );
  });

  const filteredVolunteers = volunteers.filter((v) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.skill.toLowerCase().includes(q) ||
      v.status.toLowerCase().includes(q)
    );
  });

  // init map once
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      console.warn("Missing VITE_MAPBOX_TOKEN in apps/web/.env");
      return;
    }
    mapboxgl.accessToken = token;

    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DAGUPAN_CENTER,
      zoom: 12.6,
      attributionControl: false,
      // keep users around Dagupan (optional)
      maxBounds: [
        [120.25, 15.98], // SW
        [120.43, 16.12], // NE
      ],
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    mapRef.current = map;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapContainerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // (re)draw markers when filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // clear old markers
    emergencyMarkersRef.current.forEach((m) => m.remove());
    volunteerMarkersRef.current.forEach((m) => m.remove());
    emergencyMarkersRef.current = [];
    volunteerMarkersRef.current = [];

    // emergencies
    if (showEmergencies) {
      filteredEmergencies.forEach((e) => {
        const el = document.createElement("div");
        const color = colorForSeverity(e.severity);

        el.style.width = e.type === "SOS" ? "16px" : "12px";
        el.style.height = e.type === "SOS" ? "16px" : "12px";
        el.style.borderRadius = "999px";
        el.style.background = color;
        el.style.border = "2px solid rgba(255,255,255,0.95)";
        el.style.boxShadow = "0 10px 18px rgba(0,0,0,0.25)";
        el.style.cursor = "pointer";

        // SOS subtle pulse
        if (e.type === "SOS") {
          el.style.animation = "lifelineMapPulse 1.2s ease-in-out infinite";
        }

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(`
          <div style="font-family: ui-sans-serif; min-width: 220px;">
            <div style="font-weight: 800; color: #111827; font-size: 14px;">${e.title}</div>
            <div style="margin-top: 6px; color: #6b7280; font-size: 12px;">${e.locationLabel}</div>
            <div style="margin-top: 6px; color: #9ca3af; font-size: 12px;">${e.timeAgo}</div>
            <div style="margin-top: 10px; display:inline-flex; gap:8px; align-items:center;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${color};"></span>
              <span style="font-size:12px;color:#374151;font-weight:700;">${e.severity.toUpperCase()}</span>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([e.lng, e.lat])
          .setPopup(popup)
          .addTo(map);

        emergencyMarkersRef.current.push(marker);
      });
    }

    // volunteers
    if (showVolunteers) {
      filteredVolunteers.forEach((v) => {
        const el = document.createElement("div");
        const color = colorForVolunteerStatus(v.status);

        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "999px";
        el.style.background = color;
        el.style.border = "2px solid rgba(255,255,255,0.95)";
        el.style.boxShadow = "0 10px 18px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(`
          <div style="font-family: ui-sans-serif; min-width: 220px;">
            <div style="font-weight: 800; color: #111827; font-size: 14px;">${v.name}</div>
            <div style="margin-top: 6px; color: #6b7280; font-size: 12px;">Skill: ${v.skill}</div>
            <div style="margin-top: 10px; display:inline-flex; gap:8px; align-items:center;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${color};"></span>
              <span style="font-size:12px;color:#374151;font-weight:700;">${v.status.toUpperCase()}</span>
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([v.lng, v.lat])
          .setPopup(popup)
          .addTo(map);

        volunteerMarkersRef.current.push(marker);
      });
    }
  }, [showEmergencies, showVolunteers, query, filteredEmergencies, filteredVolunteers]);

  function flyTo(lng: number, lat: number, zoom = 14) {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom, essential: true });
  }

  function centerDagupan() {
    flyTo(DAGUPAN_CENTER[0], DAGUPAN_CENTER[1], 12.6);
  }

  function locateMe() {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;

        // remove old "me" marker
        meMarkerRef.current?.remove();

        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "999px";
        el.style.background = "#2563eb";
        el.style.border = "2px solid rgba(255,255,255,0.95)";
        el.style.boxShadow = "0 12px 20px rgba(37, 99, 235, 0.25)";
        el.style.animation = "lifelineMapPulseBlue 1.2s ease-in-out infinite";

        meMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        flyTo(lng, lat, 15);
      },
      () => alert("Unable to get your location. Please enable location permission."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const counts = useMemo(() => {
    const crit = emergencies.filter((e) => e.severity === "critical").length;
    const high = emergencies.filter((e) => e.severity === "high").length;
    const volsAvail = volunteers.filter((v) => v.status === "available").length;
    return { crit, high, volsAvail };
  }, [emergencies, volunteers]);

  return (
    <LguShell title="Live Map" subtitle="Real-time view of incidents and volunteer deployment">
      {/* Page content */}
      <div className="p-6 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-4xl font-bold text-gray-900 leading-tight">Live Map</div>
            <div className="text-base text-gray-400 mt-1">
              Track emergencies and volunteers in Dagupan
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={centerDagupan}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-800 border border-gray-200 hover:bg-gray-50"
            >
              <RefreshCcw size={18} />
              Center Dagupan
            </button>

            <button
              onClick={locateMe}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
            >
              <LocateFixed size={18} />
              Locate Me
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          {/* Map Card */}
          <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div ref={mapContainerRef} className="h-[640px] w-full" />

            {/* Transparent overlay top bar */}
            <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between pointer-events-none">
              <div className="pointer-events-auto">
                <div className="inline-flex items-center gap-2 rounded-xl bg-black/40 backdrop-blur-md px-3 py-2 text-white font-semibold">
                  <Layers size={16} />
                  Live Layers
                </div>
              </div>

              {/* chips (leave space for map controls) */}
              <div className="pointer-events-auto flex items-center gap-2 mr-14">
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/30 text-xs font-semibold backdrop-blur-md">
                  {counts.crit} Critical
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/30 text-xs font-semibold backdrop-blur-md">
                  {counts.high} High
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-md">
                  {counts.volsAvail} Available
                </span>
              </div>
            </div>

            {/* Legend bottom-right */}
            <div className="absolute bottom-3 right-3 bg-black/55 text-white text-xs rounded-xl px-3 py-2 backdrop-blur pointer-events-none">
              <div className="font-semibold mb-1">Legend</div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444" }} /> Critical
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#f97316" }} /> High
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#a855f7" }} /> Medium
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} /> Low
              </div>
              <div className="mt-2 font-semibold">Volunteers</div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} /> Available
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#f97316" }} /> Busy
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444" }} /> Offline
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">Layers & Feed</div>
                <div className="text-xs text-gray-500">Filter what appears on the map</div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-gray-300"
                  placeholder="Search emergency, type, volunteer..."
                />
              </div>

              {/* toggles */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <MapPin size={16} className="text-gray-600" />
                  Emergencies
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmergencies((v) => !v)}
                  className={[
                    "h-7 w-12 rounded-full relative transition-colors",
                    showEmergencies ? "bg-red-600" : "bg-gray-300",
                  ].join(" ")}
                  aria-label="Toggle emergencies"
                >
                  <span
                    className={[
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform",
                      showEmergencies ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Users size={16} className="text-gray-600" />
                  Volunteers
                </div>
                <button
                  type="button"
                  onClick={() => setShowVolunteers((v) => !v)}
                  className={[
                    "h-7 w-12 rounded-full relative transition-colors",
                    showVolunteers ? "bg-blue-600" : "bg-gray-300",
                  ].join(" ")}
                  aria-label="Toggle volunteers"
                >
                  <span
                    className={[
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform",
                      showVolunteers ? "translate-x-6" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              {/* lists */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Emergencies
                </div>

                <div className="space-y-2">
                  {filteredEmergencies.slice(0, 6).map((e) => {
                    const Icon = iconForType(e.type);
                    return (
                      <button
                        key={e.id}
                        onClick={() => flyTo(e.lng, e.lat)}
                        className="w-full text-left rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center"
                              style={{ background: "rgba(255,255,255,0.7)" }}
                            >
                              <Icon size={18} className="text-gray-800" />
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 truncate">
                                {e.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {e.locationLabel}
                              </div>
                              <div className="text-[11px] text-gray-400">{e.timeAgo}</div>
                            </div>
                          </div>

                          <span
                            className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full border"
                            style={{
                              color: colorForSeverity(e.severity),
                              borderColor: `${colorForSeverity(e.severity)}55`,
                              background: `${colorForSeverity(e.severity)}15`,
                            }}
                          >
                            {e.severity}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-2">
                  Volunteers
                </div>

                <div className="space-y-2">
                  {filteredVolunteers.slice(0, 6).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => flyTo(v.lng, v.lat)}
                      className="w-full text-left rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{v.name}</div>
                          <div className="text-xs text-gray-500 truncate">{v.skill}</div>
                        </div>

                        <span
                          className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full border"
                          style={{
                            color: colorForVolunteerStatus(v.status),
                            borderColor: `${colorForVolunteerStatus(v.status)}55`,
                            background: `${colorForVolunteerStatus(v.status)}15`,
                          }}
                        >
                          {v.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* pulse keyframes (scoped via global CSS) */}
        <style>
          {`
            @keyframes lifelineMapPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 10px 18px rgba(0,0,0,0.25); }
              50% { transform: scale(1.15); box-shadow: 0 14px 24px rgba(239,68,68,0.28); }
            }
            @keyframes lifelineMapPulseBlue {
              0%, 100% { transform: scale(1); box-shadow: 0 12px 20px rgba(37, 99, 235, 0.25); }
              50% { transform: scale(1.15); box-shadow: 0 16px 26px rgba(37, 99, 235, 0.30); }
            }
          `}
        </style>
      </div>
    </LguShell>
  );
}
