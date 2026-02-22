import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../../theme/hooks/useThemeMode";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  LocateFixed,
  Users,
  ShieldAlert,
} from "lucide-react";
import { toastWarning } from "@/services/feedback/toast.service";

import EmergencyMap from "../../emergency/components/EmergencyMap";
import {
  EMERGENCY_TYPE_LABEL,
  iconForEmergency,
} from "../../emergency/constants/emergency.constants";
import type { DashboardEmergencyItem, DashboardStats } from "../models/lguDashboard.types";

import EmergencyQuickView from "./EmergencyQuickView";

import type { HazardZone } from "../../hazardZones/models/hazardZones.types";
import {
  HAZARD_TYPE_COLOR,
  HAZARD_TYPE_LABEL,
  HAZARD_TYPES,
} from "../../hazardZones/constants/hazardZones.constants";
import { useHazardZones } from "../../hazardZones/hooks/useHazardZones";
import {
  ensureHazardZonesLayers,
  setHazardZonesData,
  setHazardZonesVisibility,
} from "../../hazardZones/utils/hazardZones.mapbox";

function timeAgo(iso?: string) {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "-";
  const diff = Date.now() - t;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hours ago`;
  const d = Math.floor(hr / 24);
  return `${d} days ago`;
}

function severityForStatus(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return { label: "critical", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" };
  if (s === "ACKNOWLEDGED") return { label: "high", cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" };
  if (s === "RESOLVED") return { label: "moderate", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" };
  if (s === "CANCELLED") return { label: "cancelled", cls: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-300" };
  return { label: s.toLowerCase() || "unknown", cls: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-300" };
}

function progressForStatus(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return 70;
  if (s === "ACKNOWLEDGED") return 85;
  if (s === "RESOLVED") return 100;
  return 40;
}

function StatCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  badge: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-40 dark:bg-[#0E1626] dark:border-[#162544] mb-5">
      {/* top row */}
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center dark:bg-[#0B1324]">
          {icon}
        </div>

        <span className="text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300 px-2 py-1 rounded-full">
          {badge}
        </span>
      </div>

      {/* value + label */}
      <div className="mt-2 ml-3">
        <div className="text-4xl font-bold leading-none text-gray-900 dark:text-slate-100">
          {value}
        </div>
        <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {label}
        </div>
      </div>
    </div>
  );
}



function ProgressRing({ percent, isDark }: { percent: number; isDark: boolean }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-700 dark:text-slate-200"
      style={{
        background: `conic-gradient(#ef4444 ${p * 3.6}deg, ${isDark ? "#0B1324" : "#f3f4f6"} 0deg)`,
      }}
    >
      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center dark:bg-[#0E1626]">{p}%</div>
    </div>
  );
}

function MapPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
      {icon}
      {value} {label}
    </span>
  );
}

export default function LguDashboardView({
  loading,
  error,
  onRefresh,
  stats,
  statsSyncing,
  statsError,
  pins,
  recent,
  hazardZones,
  hazardsLoading,
  hazardsError,
}: {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  stats: DashboardStats;
  statsSyncing: boolean;
  statsError: string | null;
  pins: DashboardEmergencyItem[];
  recent: DashboardEmergencyItem[];
  // ✅ be defensive: API shape changes or missing prop should not crash the dashboard
  hazardZones?: HazardZone[];
  hazardsLoading: boolean;
  hazardsError: string | null;
}) {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();

  const [quickView, setQuickView] = useState<DashboardEmergencyItem | null>(null);
  const [legendMinimized, setLegendMinimized] = useState(false);

  // ✅ Allow clicking a map marker on the dashboard to open the quick view.
  const emergencyById = useMemo(() => {
    const m = new Map<string, DashboardEmergencyItem>();
    for (const e of recent ?? []) m.set(String(e.id), e);
    return m;
  }, [recent]);

  // Dashboard safety: fetch hazard zones here too so the dashboard map never shows 0 by accident.
  // (This is harmless if the parent already fetched them.)
  const {
    hazardZones: hzFromHook,
    loading: hzLoading,
    error: hzError,
    refetch: refetchHazards,
  } = useHazardZones();

  const effectiveHazardZones = (hazardZones && hazardZones.length ? hazardZones : hzFromHook) ?? [];
  const effectiveHazardsLoading = hazardsLoading || hzLoading;
  const effectiveHazardsError = hazardsError || hzError;

  const handleRefresh = () => {
    onRefresh();
    // ensure hazards refresh too (in case onRefresh only refetches emergencies)
    void refetchHazards();
  };

  const openInLiveMap = (id: string) => {
    // Deep link so Live Map can auto-open the details panel.
    setQuickView(null);
    navigate(`/lgu/live-map?emergencyId=${encodeURIComponent(id)}`);
  };


  // --- Map instance (for hazard zones overlay)
  // IMPORTANT: use state so effects re-run once the map is available.
  // (Using only a ref can miss the initial onMapReady timing.)
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const locateMe = useCallback(() => {
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
  }, [map]);

  // ✅ When opening the quick view from the list, pan/zoom the dashboard map to that emergency.
  useEffect(() => {
    if (!quickView || !map || !mapReady) return;
    if (!Number.isFinite(quickView.lng) || !Number.isFinite(quickView.lat)) return;

    try {
      map.flyTo({
        center: [quickView.lng, quickView.lat],
        zoom: Math.max(map.getZoom(), 15),
        speed: 1.2,
        essential: true,
      });
    } catch {
      // ignore
    }
  }, [quickView?.id, quickView?.lng, quickView?.lat, map, mapReady]);

  const onMapReady = useCallback((m: mapboxgl.Map) => {
    setMap(m);
    setMapReady(false);

    const setReady = () => setMapReady(true);

    // If already loaded, mark ready immediately.
    const loadedFn = (m as any).loaded?.bind(m);
    if (typeof loadedFn === "function" && loadedFn()) {
      setReady();
      return;
    }
    if (m.isStyleLoaded?.()) {
      setReady();
      return;
    }

    m.once("load", setReady);
  }, []);

  const safePins = pins ?? [];
  const safeRecent = recent ?? [];

  // ✅ only ACTIVE hazards are drawn on the dashboard map
  // older docs may not have isActive yet -> treat as true
  const safeHazardZones = useMemo(() => {
    return (effectiveHazardZones ?? []).filter((z: any) => (z as any).isActive !== false);
  }, [effectiveHazardZones]);

  // --- Apply hazard zones on the dashboard map
  useEffect(() => {
    if (!map || !mapReady) return;

    let cancelled = false;

    const apply = () => {
      if (cancelled) return;

      if (!map.isStyleLoaded()) {
        map.once("idle", apply);
        return;
      }

      try {
        ensureHazardZonesLayers(map);
        setHazardZonesData(map, safeHazardZones);
        setHazardZonesVisibility(map, true);
      } catch {
        map.once("idle", apply);
      }
    };

    apply();
    map.on("style.load", apply);

    return () => {
      cancelled = true;
      try {
        map.off("style.load", apply);
      } catch {
        // ignore
      }
    };
  }, [map, mapReady, safeHazardZones]);

  const emergenciesCount = safePins.length;
  const hazardsCount = safeHazardZones.length;

  const activeEmergencies = safeRecent
    .filter((e) => {
      const s = String(e.status || "").toUpperCase();
      return s === "OPEN" || s === "ACKNOWLEDGED" || s === "RESOLVED";
    })
    .slice(0, 6);

  const activity = safeRecent.slice(0, 5).map((e) => {
    const type = EMERGENCY_TYPE_LABEL[e.type] ?? e.type;
    return {
      text: `New ${type} report logged`,
      time: timeAgo(e.reportedAt),
    };
  });

  const volunteersValue = String(stats.availableVolunteers);
  const volunteersBadge = statsSyncing
    ? "sync"
    : statsError
      ? "retry"
      : `${stats.totalVolunteers} total`;

  const inProgressValue = String(stats.tasksInProgress);
  const inProgressBadge = statsSyncing
    ? "sync"
    : statsError
      ? "retry"
      : `${stats.pendingTasks} pending`;

  const responseValue = `${stats.responseRate}%`;
  const responseBadge = statsSyncing
    ? "sync"
    : statsError
      ? "retry"
      : stats.dispatchOffers > 0
        ? `${stats.respondedTasks}/${stats.dispatchOffers} responded`
        : "No offers yet";

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200">
        <div className="flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Stats (keeps old design, but Active Emergencies is real) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard
          icon={<AlertTriangle size={16} className="text-red-500" />}
          label="Active Emergencies"
          value={String(stats.active)}
          badge={loading ? "sync" : `${stats.open} open`}
        />
        <StatCard
          icon={<Users size={16} className="text-green-600" />}
          label="Available Volunteers"
          value={volunteersValue}
          badge={volunteersBadge}
        />
        <StatCard
          icon={<ClipboardList size={16} className="text-orange-500" />}
          label="Tasks in Progress"
          value={inProgressValue}
          badge={inProgressBadge}
        />
        <StatCard
          icon={<Activity size={16} className="text-blue-600" />}
          label="Response Rate"
          value={responseValue}
          badge={responseBadge}
        />
      </div>

      {/* Map (with hazard zones overlay + LiveMap-style pills)
          NOTE: keep map under the dashboard panels so it never steals clicks.
      */}
      <div className="mb-4 relative z-0">
        <EmergencyMap
          title={null}
          showHeader={false}
          heightClassName="h-125"
          reports={pins.map((p) => ({ id: p.id, type: p.type, lng: p.lng, lat: p.lat }))}
          onPinClick={(pin) => {
            const hit = emergencyById.get(String(pin.id));
            // If the pin is not in `recent` for some reason, still open a minimal view.
            setQuickView(
              hit ?? {
                id: String(pin.id),
                type: pin.type,
                status: "OPEN",
                lng: pin.lng,
                lat: pin.lat,
              }
            );
          }}
          onMapClick={() => {
            // Google Maps behavior: click empty map space closes the card
            setQuickView(null);
          }}
          onMapReady={onMapReady}
          fitReports="initial"
          navPosition="bottom-right"
          attributionPosition="bottom-left"
          showLocateButton={false}
          // ✅ Render the Google Maps-style card INSIDE the map (Mapbox Popup)
          popup={
            quickView
              ? {
                  lng: quickView.lng,
                  lat: quickView.lat,
                  onClose: () => setQuickView(null),
                  content: (
                    <EmergencyQuickView
                      variant="map"
                      item={quickView}
                      onClose={() => setQuickView(null)}
                      onOpenInMap={(id) => openInLiveMap(id)}
                    />
                  ),
                }
              : null
          }
        />

        {/* LiveMap-style pill bar */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-2 py-1 border border-white/10">
            <MapPill icon={<AlertTriangle size={14} />} label="Emergencies" value={emergenciesCount} />
            <MapPill icon={<ShieldAlert size={14} />} label="Hazards" value={hazardsCount} />
          </div>
        </div>

        {/* Floating Legend (same as Live Map) */}
        <div className="absolute top-16 right-3 z-20 pointer-events-none">
          <div className="pointer-events-auto rounded-xl bg-white/70 text-gray-900 backdrop-blur shadow-lg border border-white/70 overflow-hidden dark:bg-black/65 dark:text-white dark:border-white/10">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/70 dark:border-white/10">
              <div className="text-xs font-extrabold">Legend</div>
              <button
                onClick={() => setLegendMinimized((v) => !v)}
                className="h-7 w-7 rounded-md hover:bg-white/60 dark:hover:bg-white/10 grid place-items-center"
                aria-label={legendMinimized ? "Expand legend" : "Minimize legend"}
                title={legendMinimized ? "Expand" : "Minimize"}
              >
                <span className="text-sm leading-none font-black">
                  {legendMinimized ? "+" : "–"}
                </span>
              </button>
            </div>

            {!legendMinimized ? (
              <div className="px-3 py-3 w-65">
                <div className="text-[11px] font-bold text-gray-600 mb-2 dark:text-white/85">Hazard Zones</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                  {HAZARD_TYPES.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: HAZARD_TYPE_COLOR[t] }} />
                      <span>{HAZARD_TYPE_LABEL[t]}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-[11px] font-bold text-gray-600 mb-2 dark:text-white/85">Volunteers</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span>Busy</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Offline</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 text-[12px] text-gray-600 dark:text-white/80">Legend minimized</div>
            )}
          </div>
        </div>

        {/* Locate icon-only (same as Live Map) */}
        <div className="absolute right-3 z-20 pointer-events-none" style={{ bottom: 110 }}>
          <button
            onClick={locateMe}
            className="pointer-events-auto h-7.25 w-7.25 rounded-sm bg-white border border-gray-300 shadow-sm hover:bg-gray-50 grid place-items-center dark:bg-[#0E1626] dark:border-[#22365D] dark:hover:bg-[#122036]"
            aria-label="Locate me"
            title="Locate Me"
          >
            <LocateFixed size={15} className="text-gray-900 dark:text-slate-100" />
          </button>
        </div>

        {(effectiveHazardsLoading || effectiveHazardsError) && (
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
            <div className="pointer-events-auto rounded-lg bg-black/60 text-white text-xs font-bold px-3 py-2 border border-white/10 backdrop-blur">
              {effectiveHazardsLoading ? "Loading hazard zones…" : `Hazards: ${String(effectiveHazardsError)}`}
            </div>
          </div>
        )}
      </div>

      {/* Bottom panels (old layout)
          Ensure these stay above the map canvas for pointer events.
      */}
      <div className="relative z-120 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-[#0E1626] dark:border-[#162544]">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-[#162544]">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Active Emergencies</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Current incidents requiring response</div>
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-500">{loading ? "Loading…" : `${activeEmergencies.length} shown`}</div>
          </div>

          <div className="p-3 space-y-3">
            {!loading && activeEmergencies.length === 0 ? (
              <div className="text-sm text-gray-500 p-2 dark:text-slate-400">No emergency reports yet.</div>
            ) : null}

            {activeEmergencies.map((e) => {
              const typeLabel = EMERGENCY_TYPE_LABEL[e.type] ?? e.type;
              const Icon = iconForEmergency(e.type);
              const sev = severityForStatus(e.status);
              const percent = progressForStatus(e.status);

              return (
                <div
                  key={e.id}
                  className="relative z-130 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-[#0B1324] dark:border-[#162544] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#0E1626]"
                  onClick={() => setQuickView(e)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 dark:bg-[#0E1626] dark:border-[#162544]">
                      <Icon size={18} className="text-red-500" />
                    </div>

                    <div className="leading-tight min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-base font-bold text-gray-900 truncate dark:text-slate-100">{typeLabel}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sev.cls}`}>
                          {sev.label}
                        </span>
                      </div>

                      {e.notes ? (
                        <div className="text-sm text-gray-600 wrap-break-word line-clamp-2 dark:text-slate-300">{e.notes}</div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-slate-400">Pinned location</div>
                      )}

                      <div className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(e.reportedAt)}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">
                        {e.barangayName
                          ? `Barangay ${e.barangayName}, ${e.barangayCity ?? "Dagupan City"}`
                          : "Barangay: Unknown"}
                      </div>
                    </div>
                  </div>

                  <ProgressRing percent={percent} isDark={isDark} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-[#0E1626] dark:border-[#162544]">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between dark:border-[#162544]">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Activity Feed</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">Real-time updates</div>
            </div>
            <button className="text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">↗</button>
          </div>

          <div className="p-4 space-y-4">
            {!loading && activity.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-slate-400">No activity yet.</div>
            ) : null}

            {activity.map((a, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-800 dark:text-slate-200">{a.text}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup is rendered inside the map now */}
    </div>
  );
}
