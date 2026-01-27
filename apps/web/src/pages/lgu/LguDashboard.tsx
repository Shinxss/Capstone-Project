import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { AlertTriangle, Users, ClipboardList, Activity } from "lucide-react";
import LguShell from "../../components/lgu/LguShell";

type MarkerItem = {
  id: string;
  lng: number;
  lat: number;
  type: "critical" | "high" | "medium" | "low";
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

function MapboxEmergencyMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapElRef = useRef<HTMLDivElement | null>(null);

  const markers: MarkerItem[] = useMemo(
    () => [
      { id: "m1", lng: 120.19, lat: 16.07, type: "critical" },
      { id: "m2", lng: 120.195, lat: 16.085, type: "low" },
      { id: "m3", lng: 120.205, lat: 16.08, type: "medium" },
      { id: "m4", lng: 120.185, lat: 16.095, type: "high" },
      { id: "m5", lng: 120.175, lat: 16.065, type: "high" },
    ],
    []
  );

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      console.warn("Missing VITE_MAPBOX_TOKEN in apps/web/.env");
      return;
    }
    mapboxgl.accessToken = token;

    if (!mapElRef.current) return;

    const map = new mapboxgl.Map({
      container: mapElRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [120.19, 16.08],
      zoom: 11.5,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    mapRef.current = map;

    const colorByType: Record<MarkerItem["type"], string> = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#a855f7",
      low: "#22c55e",
    };

    markers.forEach((m) => {
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "999px";
      el.style.background = colorByType[m.type];
      el.style.border = "2px solid rgba(255,255,255,0.9)";
      el.style.boxShadow = "0 6px 16px rgba(0,0,0,0.35)";
      new mapboxgl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapElRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [markers]);

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div ref={mapElRef} className="h-[500px] w-full" />

      {/* Overlay header */}
      <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <div className="px-3 py-2 rounded-lg bg-black/40 backdrop-blur-md">
              Emergency Map
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 mr-14">
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/30 text-xs font-semibold backdrop-blur-md">
            2 Critical
          </span>
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/30 text-xs font-semibold backdrop-blur-md">
            12 High
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-md">
            3 Volunteers
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-black/55 text-white text-xs rounded-md px-3 py-2 backdrop-blur pointer-events-none">
        <div className="font-semibold mb-1">Volunteer Status</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Available
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500" /> Busy
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Offline
        </div>
      </div>

      <button className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-xs font-semibold px-3 py-2 rounded-md border border-gray-200 pointer-events-auto">
        Locate Me
      </button>
    </div>
  );
}

export default function LguDashboard() {
  const emergencies = [
    {
      title: "Flood",
      status: "critical",
      location: "Barangay San Jose, Quezon City",
      time: "15 min ago",
      percent: 75,
    },
    {
      title: "Fire",
      status: "high",
      location: "Barangay Poblacion, Malasi",
      time: "32 min ago",
      percent: 80,
    },
    {
      title: "Typhoon Evacuation",
      status: "critical",
      location: "Barangay Binmaley, Pasay City",
      time: "45 min ago",
      percent: 70,
    },
    {
      title: "Building Collapse",
      status: "moderate",
      location: "Barangay Binga, Caloocan",
      time: "2 hours ago",
      percent: 100,
    },
  ];

  const activity = [
    { text: "Maj. Santos completed verification task", time: "Just now" },
    { text: "Juan Dela Cruz assigned to Flood Response", time: "5 min ago" },
    { text: "New emergency reported in Quezon City", time: "15 min ago" },
    { text: "Supply delivery delayed — rerouting", time: "30 min ago" },
    { text: "Team Alpha deployed to evacuation center", time: "1 hour ago" },
  ];

  return (
    <LguShell title="Dashboard" subtitle="Welcome Back, John Doe">
      <div className="p-6">
        <div className="mb-7">
          <div className="text-4xl font-bold text-gray-900">Command Center</div>
          <div className="text-base text-gray-400">
            Real-time emergency coordination dashboard
          </div>
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
          <MapboxEmergencyMap />
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <div>
                <div className="text-sm font-bold text-gray-900">Active Emergencies</div>
                <div className="text-xs text-gray-500">
                  Current incidents requiring response
                </div>
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
              <button className="text-xs font-semibold text-gray-700 hover:text-gray-900">
                ↗
              </button>
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
