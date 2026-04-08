import { useEffect, useMemo, useState } from "react";
import EmergencyMap from "../../emergency/components/EmergencyMap";
import type { MapEmergencyPin } from "../../emergency/components/EmergencyMap";
import {
  colorForEmergency,
  emergencyTitleForType,
  type EmergencyType,
} from "../../emergency/constants/emergency.constants";

import {
  Layers,
  PanelRight,
  LocateFixed,
  RefreshCcw,
  Users,
  MapPin,
  X,
  ShieldAlert,
  Navigation2,
  AlertTriangle,
  ChevronDown,
  Power,
  Trash2,
  Droplets,
  Flame,
  Construction,
  Mountain,
} from "lucide-react";

import DispatchRespondersModal from "./DispatchRespondersModal";
import LguEmergencyDetailsPanel from "./LguEmergencyDetailsPanel";

import {
  HAZARD_TYPE_COLOR,
  HAZARD_TYPE_LABEL,
  HAZARD_TYPES,
  type HazardType,
} from "../../hazardZones/constants/hazardZones.constants";

type Props = ReturnType<typeof import("../hooks/useLguLiveMap").useLguLiveMap>;
type MapStyleOptionKey = "satellite-streets-v12" | "streets-v12" | "dark-v11";

const MAP_STYLE_OPTIONS: Array<{ key: MapStyleOptionKey; label: string; stylePath: string }> = [
  { key: "satellite-streets-v12", label: "Satellite + Streets", stylePath: "mapbox/satellite-streets-v12" },
  { key: "streets-v12", label: "Streets", stylePath: "mapbox/streets-v12" },
  { key: "dark-v11", label: "Dark", stylePath: "mapbox/dark-v11" },
];

function ToggleRow({
  icon,
  label,
  checked,
  onToggle,
  activeColorClass = "bg-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onToggle: () => void;
  activeColorClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-[#162544] dark:bg-[#0E1626]">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-slate-200">
        {icon}
        {label}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={[
          "h-8 w-[62px] rounded-full border transition-all",
          checked
            ? `${activeColorClass} border-transparent shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]`
            : "bg-gray-300 border-gray-300 dark:bg-slate-600 dark:border-slate-600",
        ].join(" ")}
        role="switch"
        aria-checked={checked}
        aria-pressed={checked}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

function Pill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/65 border border-white/70 text-gray-800 text-xs font-bold dark:bg-white/10 dark:border-white/20 dark:text-white">
      {icon}
      {value} {label}
    </span>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200">
      <div className="flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function LguLiveMapView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    // map
    mapStyleUrl,
    onMapReady,
    center,
    locateMe,
    centerDagupan,

    // search
    query,
    setQuery,

    // right panel
    layersOpen,
    setLayersOpen,

    // toggles
    showEmergencies,
    setShowEmergencies,
    showVolunteers,
    setShowVolunteers,
    showHazardZones,
    setShowHazardZones,

    // emergencies
    emergencyPins,
    onEmergencyPinClick,
    onMapClick,

    // left details panel
    selectedEmergency,
    selectedEmergencyDetails,
    selectedEmergencyTasks,
    tasksLoading,
    tasksError,
    detailsOpen,
    cleanupDetails,

    // responders dispatch + tracking
    volunteers,
    dispatchModalOpen,
    openDispatchResponders,
    closeDispatchResponders,
    dispatchSelection,
    toggleDispatchResponder,
    confirmDispatchResponders,
    assignedResponders,

    // style selector
    mapStyleKey,
    setMapStyleKey,

    // counts
    hazardsCount,
    volunteersCount,
    emergenciesCount,
    activeVolunteersCount,
    sosCount,
    liveIncidents,

    // hazard zones dropdown list
    hazardZones,
    focusHazardZoneItem,
    toggleHazardZoneItem,
    deleteHazardZoneItem,

    // hazard draw + save
    isDrawingHazard,
    hazardPointCount,
    startDrawHazard,
    cancelDrawHazard,
    undoHazardPoint,
    hazardDraft,
    draftForm,
    setDraftForm,
    saveHazardDraft,

  } = props;

  const [legendMinimized, setLegendMinimized] = useState(false);
  const [hazardsDropdownOpen, setHazardsDropdownOpen] = useState(true);
  const [mapDetailsOpen, setMapDetailsOpen] = useState(false);
  const mapPreviewToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const activeMapStyleOption =
    MAP_STYLE_OPTIONS.find((opt) => opt.key === mapStyleKey) ?? MAP_STYLE_OPTIONS[0];
  const layersPreviewUri = mapPreviewToken
    ? `https://api.mapbox.com/styles/v1/${activeMapStyleOption.stylePath}/static/120.34,16.043,11,0/220x220?access_token=${mapPreviewToken}&logo=false&attribution=false`
    : null;

  // ✅ IMPORTANT: keep maxBounds reference stable.
  // EmergencyMap recreates the Mapbox instance when maxBounds changes (dependency in its init effect).
  const maxBounds = useMemo(
    () =>
      [
        [120.25, 15.98],
        [120.43, 16.12],
      ] as any,
    []
  );

  const toHazardType = (v: unknown): HazardType =>
    HAZARD_TYPES.includes(v as HazardType) ? (v as HazardType) : "UNSAFE";

  const hazardIconFor = (hazardType: HazardType) => {
    switch (hazardType) {
      case "FLOODED":
        return <Droplets size={16} className="text-white" />;
      case "ROAD_CLOSED":
        return <Construction size={16} className="text-white" />;
      case "FIRE_RISK":
        return <Flame size={16} className="text-white" />;
      case "LANDSLIDE":
        return <Mountain size={16} className="text-white" />;
      default:
        return <ShieldAlert size={16} className="text-white" />;
    }
  };

  const effectiveDetailsWidth = useMemo(() => {
    if (detailsOpen && selectedEmergencyDetails) return "w-[420px] max-w-[92vw]";
    return "w-0";
  }, [detailsOpen, selectedEmergencyDetails]);

  const mapPins: MapEmergencyPin[] = useMemo(() => emergencyPins, [emergencyPins]);
  const emergencyPinById = useMemo(
    () => new Map(mapPins.map((pin) => [pin.id, pin])),
    [mapPins]
  );

  const formatIncidentTime = (raw?: string) => {
    if (!raw) return "Unknown time";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return "Unknown time";
    return dt.toLocaleString();
  };

  useEffect(() => {
    if (!detailsOpen) return;
    setLegendMinimized(true);
  }, [detailsOpen]);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
      {/* MAP */}
      <div className="absolute inset-0">
        <EmergencyMap
          frame="full"
          heightClassName="h-full"
          reports={mapPins}
          showHeader={false}
          showLocateButton={false}
          center={center}
          zoom={12.6}
          mapStyle={mapStyleUrl}
          maxBounds={maxBounds}
          navPosition="bottom-right"
          attributionPosition="bottom-left"
          onMapReady={onMapReady}
          onPinClick={onEmergencyPinClick}
          onMapClick={isDrawingHazard ? undefined : (_lng, _lat) => onMapClick()}
          fitReports="always"
        />
      </div>

      {/* Search bar top-left */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="pointer-events-auto h-10 w-[320px] max-w-[70vw]
                     rounded-md bg-white border-2 border-blue-500 px-3 text-sm
                     outline-none shadow-sm dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Top-right: pills + center + layers */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-2 py-1 border border-white/70 shadow-sm dark:bg-black/55 dark:border-white/10">
          <Pill icon={<AlertTriangle size={14} />} label="Emergencies" value={emergenciesCount} />
          <Pill icon={<ShieldAlert size={14} />} label="Hazards" value={hazardsCount} />
          <Pill icon={<Users size={14} />} label="Volunteers" value={volunteersCount} />
        </div>

        <button
          onClick={centerDagupan}
          className="pointer-events-auto inline-flex items-center gap-2
                     rounded-md bg-white px-3 py-2 text-sm font-semibold
                     border border-gray-200 shadow-sm hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          <RefreshCcw size={16} />
          Center Dagupan
        </button>

        <button
          onClick={() => setLayersOpen((v) => !v)}
          className="pointer-events-auto h-10 w-10 rounded-md bg-white
                     border border-gray-200 shadow-sm hover:bg-gray-50
                     grid place-items-center dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          aria-label={layersOpen ? "Close side panel" : "Open side panel"}
          title={layersOpen ? "Close side panel" : "Open side panel"}
        >
          <PanelRight size={18} />
        </button>
      </div>

      {/* Drawing helper banner */}
      {isDrawingHazard ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-black/70 text-white text-xs font-bold px-4 py-2 border border-white/10 backdrop-blur">
            {`Drawing hazard zone - click to add points, drag any point to adjust, right click a point to delete, double click to finish. (${hazardPointCount} points)`}
          </div>
        </div>
      ) : null}

      {/* Floating Legend (outside layers) */}
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
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>Idle</span>
                </div>
                <div className="flex items-center gap-2">
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

      {/* Locate icon-only (match Mapbox control size) */}
      <div className="absolute right-3 z-20 pointer-events-none" style={{ bottom: 110 }}>
        <button
          onClick={locateMe}
          className="pointer-events-auto
                     h-7.25 w-7.25 rounded-sm bg-white
                     border border-gray-300 shadow-sm hover:bg-gray-50
                     grid place-items-center dark:bg-[#0E1626] dark:border-[#22365D] dark:hover:bg-[#122036]"
          aria-label="Locate me"
          title="Locate Me"
        >
          <LocateFixed size={15} className="text-gray-900 dark:text-slate-100" />
        </button>
      </div>

      {/* Google-style layers control + map details panel */}
      <div className="absolute left-3 z-20 pointer-events-none" style={{ bottom: 24 }}>
        <button
          onClick={() => setMapDetailsOpen((v) => !v)}
          className={[
            "pointer-events-auto relative h-[96px] w-[96px] overflow-hidden rounded-2xl border-2 shadow-xl",
            "transition-transform hover:scale-[1.01]",
            mapDetailsOpen
              ? "border-white ring-2 ring-white/80 dark:border-white dark:ring-white/70"
              : "border-white/95 dark:border-white/60",
          ].join(" ")}
          aria-label={mapDetailsOpen ? "Close map details" : "Open map details"}
          title={mapDetailsOpen ? "Close map details" : "Open map details"}
        >
          {layersPreviewUri ? (
            <img
              src={layersPreviewUri}
              alt="Map layers preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-300 to-blue-500 dark:from-slate-500 dark:via-slate-600 dark:to-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />
          <div className="absolute left-2.5 bottom-2 inline-flex items-center gap-1.5 text-white drop-shadow-sm">
            <Layers size={14} />
            <span className="text-[18px] leading-none font-semibold tracking-tight">Layers</span>
          </div>
        </button>
      </div>

      {mapDetailsOpen ? (
        <div className="absolute left-3 z-30 pointer-events-none" style={{ bottom: 128 }}>
          <div className="pointer-events-auto w-[360px] max-w-[92vw] rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between dark:border-[#162544]">
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Map details</div>
              <button
                onClick={() => setMapDetailsOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-300 dark:hover:bg-[#122036]"
                aria-label="Close map details"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-5 max-h-[72vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide dark:text-slate-500">Map type</div>
                <div className="grid grid-cols-3 gap-2">
                  {MAP_STYLE_OPTIONS.map((opt) => {
                    const selectedType = mapStyleKey === opt.key;
                    const previewUri = mapPreviewToken
                      ? `https://api.mapbox.com/styles/v1/${opt.stylePath}/static/120.34,16.043,12,0/180x180?access_token=${mapPreviewToken}&logo=false&attribution=false`
                      : null;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setMapStyleKey(opt.key)}
                        className="text-left"
                      >
                        <div
                          className={[
                            "overflow-hidden rounded-xl border bg-white dark:bg-[#0E1626] dark:border-[#162544]",
                            selectedType
                              ? "border-blue-500 ring-2 ring-blue-500/40"
                              : "border-gray-200 hover:border-gray-300 dark:hover:border-[#2A416D]",
                          ].join(" ")}
                        >
                          {previewUri ? (
                            <img
                              src={previewUri}
                              alt={opt.label}
                              className="h-[82px] w-full object-cover"
                            />
                          ) : (
                            <div className="h-[82px] w-full grid place-items-center bg-gray-100 dark:bg-[#0B1220] text-xs font-bold text-gray-500 dark:text-slate-400">
                              {opt.label}
                            </div>
                          )}
                        </div>
                        <div
                          className={[
                            "mt-1 text-[11px] font-bold",
                            selectedType ? "text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-slate-300",
                          ].join(" ")}
                        >
                          {opt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide dark:text-slate-500">Tools</div>

                <button
                  onClick={() => {
                    setShowHazardZones(true);
                    startDrawHazard();
                  }}
                  className="w-full rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-3 text-sm font-extrabold flex items-center justify-center gap-2 dark:border-red-500/35 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25"
                >
                  <Navigation2 size={16} />
                  Add Hazard Zone (Draw Polygon)
                </button>

                {isDrawingHazard ? (
                  <button
                    onClick={undoHazardPoint}
                    disabled={hazardPointCount === 0}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                  >
                    Undo last point
                  </button>
                ) : null}

                {isDrawingHazard ? (
                  <button
                    onClick={cancelDrawHazard}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
                  >
                    Cancel drawing
                  </button>
                ) : null}

                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-[#162544] dark:bg-[#0E1626]">
                  <button
                    type="button"
                    onClick={() => setHazardsDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-900 bg-gray-50 dark:bg-[#122036] dark:text-slate-100"
                    aria-label={hazardsDropdownOpen ? "Collapse hazard zones" : "Expand hazard zones"}
                  >
                    <span className="text-sm font-extrabold">
                      Hazard Zones ({hazardZones?.length ?? 0})
                    </span>
                    <ChevronDown
                      size={18}
                      className={["transition-transform", hazardsDropdownOpen ? "rotate-180" : "rotate-0"].join(
                        " "
                      )}
                    />
                  </button>

                  {hazardsDropdownOpen ? (
                    <div className="px-3 pb-3 space-y-2">
                      {(hazardZones ?? []).length === 0 ? (
                        <div className="text-xs text-gray-500 px-1 pb-2 dark:text-slate-400">No hazard zones yet.</div>
                      ) : null}

                      {(hazardZones ?? []).map((z: any) => {
                        const id = String(z._id);
                        const isActive = (z as any).isActive !== false;
                        const ht = toHazardType(z.hazardType);
                        const color = HAZARD_TYPE_COLOR[ht];

                        return (
                          <div
                            key={id}
                            onClick={() => focusHazardZoneItem(id)}
                            onKeyDown={(event) => {
                              if (event.target !== event.currentTarget) return;
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                focusHazardZoneItem(id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={[
                              "flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 cursor-pointer hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:border-[#22365D] dark:bg-[#0B1220] dark:hover:bg-[#122036] dark:focus-visible:ring-[#2A416D]",
                              isActive ? "opacity-100" : "opacity-60",
                            ].join(" ")}
                            title="Zoom to hazard zone"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                                style={{ backgroundColor: color }}
                              >
                                {hazardIconFor(ht)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-gray-900 truncate dark:text-slate-100">{z.name}</div>
                                <div className="text-xs text-gray-600 truncate dark:text-slate-400">
                                  {HAZARD_TYPE_LABEL[ht]} | {isActive ? "On" : "Off"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void toggleHazardZoneItem(id);
                                }}
                                className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-100 grid place-items-center dark:border-[#22365D] dark:hover:bg-[#122036]"
                                aria-label={isActive ? "Turn off hazard zone" : "Turn on hazard zone"}
                                title={isActive ? "Turn off" : "Turn on"}
                              >
                                <Power
                                  size={18}
                                  className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void deleteHazardZoneItem(id);
                                }}
                                className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-100 grid place-items-center dark:border-[#22365D] dark:hover:bg-[#122036]"
                                aria-label="Delete hazard zone"
                                title="Delete"
                              >
                                <Trash2 size={18} className="text-red-500 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {hazardDraft ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 dark:border-[#162544] dark:bg-[#0E1626]">
                    <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Save hazard zone</div>

                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1 dark:text-slate-500">Name</div>
                      <input
                        value={draftForm.name}
                        onChange={(e) => setDraftForm((s) => ({ ...s, name: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-100 dark:placeholder:text-slate-500"
                        placeholder="e.g., Flooded road segment"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1 dark:text-slate-500">Hazard type</div>
                      <select
                        value={draftForm.hazardType}
                        onChange={(e) => setDraftForm((s) => ({ ...s, hazardType: e.target.value as any }))}
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-100"
                      >
                        {HAZARD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {HAZARD_TYPE_LABEL[t]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={saveHazardDraft}
                      className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3 text-sm font-extrabold"
                    >
                      Save
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <aside
        className={[
          "absolute left-0 top-0 h-full z-30 bg-white border-r border-gray-200 transition-all duration-200 overflow-hidden dark:bg-[#0B1220] dark:border-[#162544]",
          effectiveDetailsWidth,
        ].join(" ")}
      >
        <LguEmergencyDetailsPanel
          open={detailsOpen && !!selectedEmergencyDetails}
          onClose={cleanupDetails}
          emergencyDetails={selectedEmergencyDetails}
          emergencyReport={selectedEmergency}
          tasks={selectedEmergencyTasks}
          tasksLoading={tasksLoading}
          tasksError={tasksError}
          onOpenDispatch={openDispatchResponders}
          assignedRespondersFallback={assignedResponders}
        />
      </aside>

      <DispatchRespondersModal
        open={dispatchModalOpen}
        emergency={selectedEmergencyDetails}
        volunteers={volunteers}
        selectedIds={dispatchSelection}
        onToggle={toggleDispatchResponder}
        onClose={closeDispatchResponders}
        onConfirm={confirmDispatchResponders}
      />

      {/* RIGHT SIDE PANEL (collapsible, for layers + stats + incidents) */}
      <aside
        className={[
          "absolute right-0 top-0 h-full z-30 bg-white border-l border-gray-200 transition-all duration-200 overflow-hidden dark:bg-[#0B1220] dark:border-[#162544]",
          layersOpen ? "w-90" : "w-0 border-l-0",
        ].join(" ")}
      >
        {layersOpen ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between dark:border-[#162544]">
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Live map panel</div>
              <button
                onClick={() => setLayersOpen(false)}
                className="h-9 w-9 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-300 dark:hover:bg-[#122036]"
                aria-label="Close panel"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto">
              {/* LAYERS */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide dark:text-slate-500">Layers</div>

                <ToggleRow
                  icon={<MapPin size={16} className="text-gray-600 dark:text-slate-400" />}
                  label="Emergencies"
                  checked={showEmergencies}
                  onToggle={() => setShowEmergencies((v) => !v)}
                  activeColorClass="bg-red-600"
                />

                <ToggleRow
                  icon={<Users size={16} className="text-gray-600 dark:text-slate-400" />}
                  label="Volunteers"
                  checked={showVolunteers}
                  onToggle={() => setShowVolunteers((v) => !v)}
                  activeColorClass="bg-blue-600"
                />

                <ToggleRow
                  icon={<ShieldAlert size={16} className="text-gray-600 dark:text-slate-400" />}
                  label="Hazard Zones"
                  checked={showHazardZones}
                  onToggle={() => setShowHazardZones((v) => !v)}
                  activeColorClass="bg-amber-600"
                />
              </div>

              {/* STATS */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide dark:text-slate-500">Stats</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-300">
                      <AlertTriangle size={13} />
                      Emergencies
                    </div>
                    <div className="mt-1 text-lg font-black text-red-700 dark:text-red-200">{emergenciesCount}</div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                      <Users size={13} />
                      Active
                    </div>
                    <div className="mt-1 text-lg font-black text-blue-700 dark:text-blue-200">
                      {activeVolunteersCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <ShieldAlert size={13} />
                      SOS
                    </div>
                    <div className="mt-1 text-lg font-black text-amber-700 dark:text-amber-200">{sosCount}</div>
                  </div>
                </div>
              </div>

              {/* LIVE INCIDENTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide dark:text-slate-500">
                    Live incidents
                  </div>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400">
                    {liveIncidents.length} active
                  </span>
                </div>

                {liveIncidents.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-4 text-xs font-semibold text-gray-600 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-400">
                    No active incidents.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveIncidents.map((incident) => {
                      const emergencyType = incident.emergencyType as EmergencyType;
                      const emergencyTypeColor = colorForEmergency(emergencyType);
                      const emergencyTypeLabel = emergencyTitleForType(emergencyType);
                      const status = String(incident.status || "unknown").toUpperCase();
                      const statusClass =
                        status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : status === "RESPONDING"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-slate-500/20 dark:text-slate-300";

                      return (
                        <button
                          key={incident.id}
                          type="button"
                          onClick={() => {
                            const pin = emergencyPinById.get(incident.id);
                            if (pin) onEmergencyPinClick(pin);
                          }}
                          className="w-full text-left rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-3 dark:border-[#162544] dark:bg-[#0E1626] dark:hover:bg-[#122036]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black",
                                  ].join(" ")}
                                  style={{
                                    backgroundColor: `${emergencyTypeColor}1A`,
                                    color: emergencyTypeColor,
                                    borderColor: `${emergencyTypeColor}4D`,
                                  }}
                                >
                                  {emergencyTypeLabel}
                                </span>
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                                    statusClass,
                                  ].join(" ")}
                                >
                                  {status}
                                </span>
                              </div>

                              <div className="mt-1 text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug">
                                {incident.locationText || "Unknown location"}
                              </div>

                              <div className="text-[11px] text-gray-600 dark:text-slate-400 truncate">
                                {incident.source || "Unknown source"}
                              </div>
                            </div>

                            <div className="text-[11px] font-semibold text-gray-500 dark:text-slate-500 shrink-0">
                              {formatIncidentTime(incident.reportedAt)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

