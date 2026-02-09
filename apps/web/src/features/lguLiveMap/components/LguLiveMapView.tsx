import { useMemo, useState } from "react";
import EmergencyMap from "../../emergency/components/EmergencyMap";
import type { MapEmergencyPin } from "../../emergency/components/EmergencyMap";

import {
  Layers,
  LocateFixed,
  RefreshCcw,
  Users,
  MapPin,
  X,
  ShieldAlert,
  Navigation2,
  AlertTriangle,
} from "lucide-react";

import {
  HAZARD_TYPE_COLOR,
  HAZARD_TYPE_LABEL,
  HAZARD_TYPES,
} from "../../hazardZones/constants/hazardZones.constants";

type Props = ReturnType<typeof import("../hooks/useLguLiveMap").useLguLiveMap>;

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
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
        {icon}
        {label}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={[
          "h-7 w-12 rounded-full relative transition-colors",
          checked ? activeColorClass : "bg-gray-300",
        ].join(" ")}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={[
            "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
      {icon}
      {value} {label}
    </span>
  );
}

export default function LguLiveMapView(props: Props) {
  const {
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
    emergenciesLoading,
    emergenciesError,
    refetchEmergencies,
    onEmergencyPinClick,
    onMapClick,

    // left details
    selectedEmergencyDetails,
    detailsOpen,
    setDetailsOpen,
    cleanupDetails,

    // style selector
    mapStyleKey,
    setMapStyleKey,

    // counts
    hazardsCount,
    volunteersCount,
    emergenciesCount,

    // hazard draw + save
    isDrawingHazard,
    startDrawHazard,
    cancelDrawHazard,
    hazardDraft,
    draftForm,
    setDraftForm,
    saveHazardDraft,

    // hazard fetch
    hazardZonesLoading,
    hazardZonesError,
    refetchHazardZones,
  } = props;

  const [legendMinimized, setLegendMinimized] = useState(false);

  const effectiveDetailsWidth = useMemo(() => {
    if (detailsOpen) return "w-[360px]";
    if (selectedEmergencyDetails) return "w-[44px]";
    return "w-0";
  }, [detailsOpen, selectedEmergencyDetails]);

  const onMapBackgroundClick = () => {
    onMapClick();
  };

  const mapPins: MapEmergencyPin[] = useMemo(() => emergencyPins, [emergencyPins]);

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
          maxBounds={[
            [120.25, 15.98],
            [120.43, 16.12],
          ]}
          navPosition="bottom-right"
          attributionPosition="bottom-left"
          onMapReady={onMapReady}
          onPinClick={onEmergencyPinClick}
          onMapClick={isDrawingHazard ? undefined : (_lng, _lat) => onMapClick()}
          fitReports="initial"
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
                     outline-none shadow-sm"
        />
      </div>

      {/* Top-right: pills + center + layers */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-2 py-1 border border-white/10">
          <Pill icon={<AlertTriangle size={14} />} label="Emergencies" value={emergenciesCount} />
          <Pill icon={<ShieldAlert size={14} />} label="Hazards" value={hazardsCount} />
          <Pill icon={<Users size={14} />} label="Volunteers" value={volunteersCount} />
        </div>

        <button
          onClick={centerDagupan}
          className="pointer-events-auto inline-flex items-center gap-2
                     rounded-md bg-white px-3 py-2 text-sm font-semibold
                     border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          <RefreshCcw size={16} />
          Center Dagupan
        </button>

        <button
          onClick={() => setLayersOpen(true)}
          className="pointer-events-auto h-10 w-10 rounded-md bg-white
                     border border-gray-200 shadow-sm hover:bg-gray-50
                     grid place-items-center"
          aria-label="Open layers panel"
          title="Layers"
        >
          <Layers size={18} />
        </button>
      </div>

      {/* Drawing helper banner */}
      {isDrawingHazard ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-black/70 text-white text-xs font-bold px-4 py-2 border border-white/10 backdrop-blur">
            Drawing hazard zone — click to add points, double click to finish.
          </div>
        </div>
      ) : null}

      {/* Floating Legend (outside layers) */}
      <div className="absolute top-16 right-3 z-20 pointer-events-none">
        <div className="pointer-events-auto rounded-xl bg-black/65 text-white backdrop-blur shadow-lg border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="text-xs font-extrabold">Legend</div>
            <button
              onClick={() => setLegendMinimized((v) => !v)}
              className="h-7 w-7 rounded-md hover:bg-white/10 grid place-items-center"
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
              <div className="text-[11px] font-bold text-white/85 mb-2">Hazard Zones</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                {HAZARD_TYPES.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: HAZARD_TYPE_COLOR[t] }} />
                    <span>{HAZARD_TYPE_LABEL[t]}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] font-bold text-white/85 mb-2">Volunteers</div>
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
            <div className="px-3 py-2 text-[12px] text-white/80">Legend minimized</div>
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
                     grid place-items-center"
          aria-label="Locate me"
          title="Locate Me"
        >
          <LocateFixed size={15} className="text-gray-900" />
        </button>
      </div>

      {/* LEFT DETAILS PANEL (only opens on emergency pin click) */}
      <aside
        className={[
          "absolute left-0 top-0 h-full z-30 bg-white border-r border-gray-200 transition-all duration-200 overflow-hidden",
          effectiveDetailsWidth,
        ].join(" ")}
      >
        {detailsOpen ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">Emergency Details</div>
              <button
                onClick={() => setDetailsOpen(false)}
                className="h-9 w-9 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700"
                aria-label="Minimize details"
                title="Minimize"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {!selectedEmergencyDetails ? (
                <div className="text-sm text-gray-600">Select an emergency pin to view details.</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-base font-extrabold text-gray-900">
                      {selectedEmergencyDetails.emergencyType}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="font-bold text-gray-900">{selectedEmergencyDetails.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Source</div>
                        <div className="font-bold text-gray-900">
                          {selectedEmergencyDetails.source ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Barangay</div>
                      <div className="font-bold text-gray-900">
                        {selectedEmergencyDetails.barangayName ?? "—"}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Reported At</div>
                      <div className="font-bold text-gray-900">
                        {selectedEmergencyDetails.reportedAt
                          ? new Date(selectedEmergencyDetails.reportedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Notes</div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {selectedEmergencyDetails.notes ?? "—"}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      {selectedEmergencyDetails.lng.toFixed(6)}, {selectedEmergencyDetails.lat.toFixed(6)}
                    </div>
                  </div>

                  <button
                    onClick={cleanupDetails}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : selectedEmergencyDetails ? (
          // minimized tab
          <div className="h-full flex items-start justify-center pt-3">
            <button
              onClick={() => setDetailsOpen(true)}
              className="h-10 w-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 grid place-items-center"
              title="Open details"
              aria-label="Open details"
            >
              <MapPin size={18} className="text-gray-700" />
            </button>
          </div>
        ) : null}
      </aside>

      {/* RIGHT LAYERS PANEL (collapsible, for styles + toggles + draw hazards) */}
      <aside
        className={[
          "absolute right-0 top-0 h-full z-30 bg-white border-l border-gray-200 transition-all duration-200 overflow-hidden",
          layersOpen ? "w-90" : "w-0 border-l-0",
        ].join(" ")}
      >
        {layersOpen ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">Layers & Map</div>
              <button
                onClick={() => setLayersOpen(false)}
                className="h-9 w-9 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700"
                aria-label="Close panel"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto">
              {/* MAP STYLE */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Map style</div>
                <div className="space-y-2">
                  {[
                    { key: "satellite-streets-v12", label: "Satellite + Streets" },
                    { key: "streets-v12", label: "Streets" },
                    { key: "dark-v11", label: "Dark" },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 cursor-pointer"
                    >
                      <div className="text-sm font-bold text-gray-800">{opt.label}</div>
                      <input
                        type="radio"
                        name="map-style"
                        checked={mapStyleKey === (opt.key as any)}
                        onChange={() => setMapStyleKey(opt.key as any)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* LAYERS */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Layers</div>

                <ToggleRow
                  icon={<MapPin size={16} className="text-gray-600" />}
                  label="Emergencies"
                  checked={showEmergencies}
                  onToggle={() => setShowEmergencies((v) => !v)}
                  activeColorClass="bg-red-600"
                />

                <ToggleRow
                  icon={<Users size={16} className="text-gray-600" />}
                  label="Volunteers"
                  checked={showVolunteers}
                  onToggle={() => setShowVolunteers((v) => !v)}
                  activeColorClass="bg-blue-600"
                />

                <ToggleRow
                  icon={<ShieldAlert size={16} className="text-gray-600" />}
                  label="Hazard Zones"
                  checked={showHazardZones}
                  onToggle={() => setShowHazardZones((v) => !v)}
                  activeColorClass="bg-amber-600"
                />
              </div>

              {/* TOOLS */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tools</div>

                <button
                  onClick={() => {
                    setShowHazardZones(true);
                    startDrawHazard();
                  }}
                  className="w-full rounded-xl bg-black text-white hover:bg-black/90 px-4 py-3 text-sm font-extrabold flex items-center justify-center gap-2"
                >
                  <Navigation2 size={16} />
                  Add Hazard Zone (Draw Polygon)
                </button>

                {isDrawingHazard ? (
                  <button
                    onClick={cancelDrawHazard}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800"
                  >
                    Cancel drawing
                  </button>
                ) : null}

                {/* Draft save form */}
                {hazardDraft ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="text-sm font-extrabold text-gray-900">Save hazard zone</div>

                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1">Name</div>
                      <input
                        value={draftForm.name}
                        onChange={(e) => setDraftForm((s) => ({ ...s, name: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Flooded road segment"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1">Hazard type</div>
                      <select
                        value={draftForm.hazardType}
                        onChange={(e) =>
                          setDraftForm((s) => ({ ...s, hazardType: e.target.value as any }))
                        }
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
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

                    <div className="text-xs text-gray-500">
                      Polygon captured. Saving will store this in MongoDB.
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-xs font-bold text-gray-500">Sync</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => refetchEmergencies()}
                      className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800"
                      title="Refresh emergencies"
                    >
                      Refresh emergencies
                    </button>
                    <button
                      onClick={() => refetchHazardZones()}
                      className="rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800"
                      title="Refresh hazard zones"
                    >
                      Refresh hazards
                    </button>
                  </div>

                  {(emergenciesLoading || hazardZonesLoading) && (
                    <div className="mt-2 text-xs text-gray-500">Loading…</div>
                  )}
                  {emergenciesError ? (
                    <div className="mt-2 text-xs text-red-600">Emergencies: {String(emergenciesError)}</div>
                  ) : null}
                  {hazardZonesError ? (
                    <div className="mt-2 text-xs text-red-600">Hazards: {String(hazardZonesError)}</div>
                  ) : null}
                </div>
              </div>

              {/* Quick info */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quick info</div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                    <div className="text-xs text-gray-500">Emergencies</div>
                    <div className="font-extrabold text-gray-900">{emergenciesCount}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                    <div className="text-xs text-gray-500">Hazards</div>
                    <div className="font-extrabold text-gray-900">{hazardsCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
