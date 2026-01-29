// apps/web/src/pages/lgu/LguDashboard.tsx
import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot, type Root } from "react-dom/client";
import {
  AlertTriangle,
  Users,
  ClipboardList,
  Activity,
  Droplet,
  Flame,
  Wind,
  Zap,
  Building2,
  Siren,
} from "lucide-react";

import LguShell from "../../components/lgu/LguShell";

type EmergencyType = "SOS" | "Flood" | "Fire" | "Typhoon" | "Earthquake" | "Collapse";

type EmergencyReport = {
  id: string;
  type: EmergencyType;
  title: string;
  lng: number;
  lat: number;
};

function StatCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
      <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
        {badge}
      </span>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-700"
      style={{
        background: `conic-gradient(#ef4444 ${p * 3.6}deg, #f3f4f6 0deg)`,
      }}
    >
      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
        {p}%
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function iconForEmergency(type: EmergencyType) {
  switch (type) {
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
    case "SOS":
      return Siren;
    default:
      return AlertTriangle;
  }
}

function colorForEmergency(type: EmergencyType) {
  switch (type) {
    case "Flood":
      return "#2563EB"; // blue
    case "Fire":
      return "#DC2626"; // red
    case "Typhoon":
      return "#B91C1C"; // deep red
    case "Earthquake":
      return "#F59E0B"; // amber
    case "Collapse":
      return "#CA8A04"; // yellow-ish
    case "SOS":
      return "#EF4444"; // bright red
    default:
      return "#64748B"; // slate
  }
}

/**
 * ✅ Marker UI:
 * - Large pulse zone
 * - Icon centered (smaller icon)
 */
function EmergencyMarker({ type }: { type: EmergencyType }) {
  const Icon = iconForEmergency(type);
  const color = colorForEmergency(type);

  return (
    <div className="relative h-[76px] w-[76px] pointer-events-none">
      {/* BIG pulse zone */}
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 76,
          height: 76,
          transform: "translate(-50%, -50%)",
          background: hexToRgba(color, 0.18),
          border: `2px solid ${hexToRgba(color, 0.35)}`,
          animation: "llPulse 1.7s ease-out infinite",
        }}
      />
      <span
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 76,
          height: 76,
          transform: "translate(-50%, -50%)",
          background: hexToRgba(color, 0.1),
          border: `2px solid ${hexToRgba(color, 0.22)}`,
          animation: "llPulse 1.7s ease-out infinite",
          animationDelay: "0.85s",
        }}
      />

      {/* CENTER PIN */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full shadow-xl"
        style={{
          width: 38,
          height: 38,
          transform: "translate(-50%, -50%)",
          border: `3px solid ${hexToRgba(color, 0.95)}`,
          background: "rgba(255,255,255,0.98)",
          zIndex: 10,
        }}
      >
        {/* subtle wave inside */}
        <div
          className="absolute inset-[5px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(color, 0.25)} 0%, rgba(255,255,255,0) 65%)`,
            animation: "llInnerWave 1.4s ease-in-out infinite",
          }}
        />
        {/* SMALLER icon in the middle */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function ensureMarkerStylesOnce() {
  const id = "ll-dashboard-marker-styles";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @keyframes llPulse {
      0%   { transform: translate(-50%, -50%) scale(0.45); opacity: 0.75; }
      70%  { opacity: 0.18; }
      100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0; }
    }
    @keyframes llInnerWave {
      0%   { transform: scale(0.92); opacity: 0.65; }
      50%  { transform: scale(1.05); opacity: 0.35; }
      100% { transform: scale(0.92); opacity: 0.65; }
    }
  `;
  document.head.appendChild(style);
}

function MapboxEmergencyMap({ reports }: { reports: EmergencyReport[] }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureMarkerStylesOnce();

    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      console.warn("Missing VITE_MAPBOX_TOKEN in apps/web/.env");
      return;
    }
    mapboxgl.accessToken = token;

    if (!mapElRef.current) return;

    // ✅ Dagupan center
    const DAGUPAN_CENTER: [number, number] = [120.3333, 16.0432];

    const map = new mapboxgl.Map({
      container: mapElRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DAGUPAN_CENTER,
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    mapRef.current = map;

    const markerObjs: mapboxgl.Marker[] = [];
    const roots: Root[] = [];

    map.on("load", () => {
      reports.forEach((r) => {
        const el = document.createElement("div");
        const root = createRoot(el);
        root.render(<EmergencyMarker type={r.type} />);
        roots.push(root);

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([r.lng, r.lat])
          .addTo(map);

        markerObjs.push(marker);
      });

      if (reports.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        reports.forEach((r) => bounds.extend([r.lng, r.lat]));
        map.fitBounds(bounds, { padding: 140, maxZoom: 14, duration: 650 });
      }
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapElRef.current);

    return () => {
      ro.disconnect();
      markerObjs.forEach((m) => m.remove());
      roots.forEach((rt) => rt.unmount());
      map.remove();
      mapRef.current = null;
    };
  }, [reports]);

  const counts = useMemo(() => {
    const c = { SOS: 0, Fire: 0, Other: 0 };
    reports.forEach((r) => {
      if (r.type === "SOS") c.SOS += 1;
      else if (r.type === "Fire") c.Fire += 1;
      else c.Other += 1;
    });
    return c;
  }, [reports]);

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div ref={mapElRef} className="h-[500px] w-full" />

      {/* overlay header */}
      <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <div className="px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md">Emergency Map</div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 mr-14">
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/30 text-xs font-semibold backdrop-blur-md">
            {counts.SOS} SOS
          </span>
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/30 text-xs font-semibold backdrop-blur-md">
            {counts.Fire} Fire
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-md">
            {counts.Other} Other
          </span>
        </div>
      </div>

      <button className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-xs font-semibold px-3 py-2 rounded-md border border-gray-200 pointer-events-auto">
        Locate Me
      </button>
    </div>
  );
}

export default function LguDashboard() {
  // ✅ Dagupan-only static pinpoints (adjust anytime)
  const reports: EmergencyReport[] = useMemo(
    () => [
      {
        id: "sos-1",
        type: "SOS",
        title: "SOS: Flash Flood Emergency (Calmay)",
        lng: 120.3365,
        lat: 16.0458,
      },
      {
        id: "fire-1",
        type: "Fire",
        title: "Residential Fire (Poblacion Oeste)",
        lng: 120.3348,
        lat: 16.0428,
      },
      {
        id: "collapse-1",
        type: "Collapse",
        title: "Building Collapse (Tapuac)",
        lng: 120.3456,
        lat: 16.0294,
      },
      {
        id: "typhoon-1",
        type: "Typhoon",
        title: "Typhoon Evacuation Support (Bonuan Binloc)",
        lng: 120.3092,
        lat: 16.0732,
      },
    ],
    []
  );

  const emergencies = [
    {
      title: "Flood",
      status: "critical",
      location: "Barangay Calmay, Dagupan City",
      time: "15 min ago",
      percent: 75,
    },
    {
      title: "Fire",
      status: "high",
      location: "Poblacion Oeste, Dagupan City",
      time: "32 min ago",
      percent: 80,
    },
    {
      title: "Typhoon Evacuation",
      status: "critical",
      location: "Bonuan Binloc, Dagupan City",
      time: "45 min ago",
      percent: 70,
    },
    {
      title: "Building Collapse",
      status: "moderate",
      location: "Tapuac, Dagupan City",
      time: "2 hours ago",
      percent: 100,
    },
  ];

  const activity = [
    { text: "Dagupan DRRMO verified new SOS report", time: "Just now" },
    { text: "Responder team assigned to Calmay Flood Response", time: "5 min ago" },
    { text: "New emergency reported in Poblacion Oeste", time: "15 min ago" },
    { text: "Supply delivery delayed — rerouting to Bonuan", time: "30 min ago" },
    { text: "Team Alpha deployed to evacuation center (Bonuan)", time: "1 hour ago" },
  ];

  return (
    <LguShell title="Dashboard" subtitle="Welcome Back, John Doe">
      <div className="p-6">
        <div className="mb-7">
          <div className="text-4xl font-bold text-gray-900">Command Center</div>
          <div className="text-base text-gray-400">Real-time emergency coordination dashboard</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <StatCard
            icon={<AlertTriangle size={16} className="text-red-500" />}
            label="Active Emergencies"
            value="12"
            badge="+2.3"
          />
          <StatCard
            icon={<Users size={16} className="text-green-600" />}
            label="Available Volunteers"
            value="847"
            badge="+1.4"
          />
          <StatCard
            icon={<ClipboardList size={16} className="text-orange-500" />}
            label="Tasks in Progress"
            value="156"
            badge="+0.9"
          />
          <StatCard
            icon={<Activity size={16} className="text-blue-600" />}
            label="Response Rate"
            value="94%"
            badge="+1.2"
          />
        </div>

        {/* Map */}
        <div className="mb-4">
          <MapboxEmergencyMap reports={reports} />
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <div>
                <div className="text-sm font-bold text-gray-900">Active Emergencies</div>
                <div className="text-xs text-gray-500">Current incidents requiring response</div>
              </div>
              <button className="text-xs font-semibold text-gray-700 hover:text-gray-900">
                View All →
              </button>
            </div>

            <div className="p-3 space-y-3">
              {emergencies.map((e) => (
                <div
                  key={e.title}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-bold text-gray-900">{e.title}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                          {e.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">{e.location}</div>
                      <div className="text-xs text-gray-400">{e.time}</div>
                    </div>
                  </div>

                  <ProgressRing percent={e.percent} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">Activity Feed</div>
                <div className="text-xs text-gray-500">Real-time updates</div>
              </div>
              <button className="text-xs font-semibold text-gray-700 hover:text-gray-900">↗</button>
            </div>

            <div className="p-4 space-y-4">
              {activity.map((a, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{a.text}</div>
                    <div className="text-xs text-gray-400">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LguShell>
  );
}
