import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useSearchParams } from "react-router-dom";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import { toastError, toastSuccess, toastWarning } from "@/services/feedback/toast.service";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

import type { MapEmergencyPin } from "../../emergency/components/EmergencyMap";
import { normalizeEmergencyType } from "../../emergency/constants/emergency.constants";
import { useLguEmergencies } from "../../emergency/hooks/useLguEmergencies";

import { useHazardZones } from "../../hazardZones/hooks/useHazardZones";
import { HAZARD_TYPES } from "../../hazardZones/constants/hazardZones.constants";
import {
  ensureHazardZonesLayers,
  setHazardZonesData,
  setHazardZonesVisibility,
} from "../../hazardZones/utils/hazardZones.mapbox";

import {
  clearHazardDraft,
  ensureHazardDraftLayers,
  setHazardDraftData,
  setHazardDraftVisibility,
} from "../../hazardZones/utils/hazardDraft.mapbox";

import { DAGUPAN_CENTER, MAP_STYLE_URL } from "../constants/lguLiveMap.constants";
import type {
  HazardDraft,
  HazardDraftFormState,
  LguEmergencyDetails,
  MapStyleKey,
  Volunteer,
} from "../models/lguLiveMap.types";
import { colorForVolunteerStatus } from "../utils/lguLiveMap.colors";
import { createDispatchOffers } from "../services/dispatch.service";
import { fetchDispatchVolunteers } from "../services/volunteers.service";

type LngLat = [number, number];

function isResolvedEmergencyStatus(raw?: string) {
  const up = String(raw ?? "").toUpperCase();
  return up === "RESOLVED" || up === "CANCELLED";
}

export function useLguLiveMap() {
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const focusEmergencyId = searchParams.get("emergencyId");

  // Prevent re-opening details if the user already closed it manually.
  const autoFocusedIdRef = useRef<string | null>(null);
  const autoFlewIdRef = useRef<string | null>(null);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const volunteerMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const meMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);

  // UI
  const [query, setQuery] = useState("");
  const [layersOpen, setLayersOpen] = useState(false);

  // visibility toggles
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [showHazardZones, setShowHazardZones] = useState(true);

  // map style
  const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>("satellite-streets-v12");

  // left details panel
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // hazard draw + save form
  const [isDrawingHazard, setIsDrawingHazard] = useState(false);
  const pointsRef = useRef<LngLat[]>([]);

  const [hazardDraft, setHazardDraft] = useState<HazardDraft | null>(null);
  const [draftForm, setDraftForm] = useState<HazardDraftFormState>({
    name: "",
    hazardType: HAZARD_TYPES[0],
  });

  // data
  const {
    reports,
    loading: emergenciesLoading,
    error: emergenciesError,
    refetch: refetchEmergencies,
  } = useLguEmergencies();

  const activeReports = useMemo(() => {
    return (reports ?? []).filter((r) => !isResolvedEmergencyStatus(r.status));
  }, [reports]);

  const {
    hazardZones,
    loading: hazardZonesLoading,
    error: hazardZonesError,
    refetch: refetchHazardZones,
    create: createHazardZone,
    remove: removeHazardZone,
    setStatus: setHazardZoneStatus,
  } = useHazardZones();

  // ✅ only ACTIVE hazard zones are rendered on the map
  // older docs may not have isActive yet -> treat as true
  const activeHazardZones = useMemo(() => {
    return (hazardZones ?? []).filter((z: any) => (z as any).isActive !== false);
  }, [hazardZones]);

  const hazardsTotalCount = (hazardZones ?? []).length;
  const hazardsActiveCount = activeHazardZones.length;

  // Volunteers loaded from MongoDB (Users collection)
  // Stored in state so we can update status when dispatching.
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersError, setVolunteersError] = useState<string | null>(null);

  const refetchVolunteers = useCallback(async () => {
    setVolunteersLoading(true);
    setVolunteersError(null);
    try {
      const items = await fetchDispatchVolunteers();
      setVolunteers(items);
    } catch (err: any) {
      setVolunteersError(err?.response?.data?.message ?? err?.message ?? "Failed to load volunteers");
    } finally {
      setVolunteersLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchVolunteers();
  }, [refetchVolunteers]);

  // Per-emergency responder assignment (volunteer ids)
  const [assignmentsByEmergency, setAssignmentsByEmergency] = useState<Record<string, string[]>>({});

  // Dispatch + tracking UI state
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchSelection, setDispatchSelection] = useState<string[]>([]);
  const [trackOpen, setTrackOpen] = useState(false);

  const filteredVolunteers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return volunteers;
    return volunteers.filter((v) => {
      return (
        v.name.toLowerCase().includes(q) ||
        v.skill.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
      );
    });
  }, [volunteers, query]);

  const emergencyPins: MapEmergencyPin[] = useMemo(() => {
    if (!showEmergencies) return [];
    return activeReports
      .filter((r) => r?.location?.coordinates?.length === 2)
      .map((r) => {
        const [lng, lat] = r.location.coordinates;
        return {
          id: r._id,
          type: normalizeEmergencyType(r.emergencyType),
          lng,
          lat,
        };
      });
  }, [activeReports, showEmergencies]);

  const selectedEmergency = useMemo(() => {
    if (!selectedEmergencyId) return undefined;
    return activeReports.find((r) => r._id === selectedEmergencyId);
  }, [activeReports, selectedEmergencyId]);

  const selectedEmergencyDetails: LguEmergencyDetails | null = useMemo(() => {
    if (!selectedEmergency?.location?.coordinates) return null;
    const [lng, lat] = selectedEmergency.location.coordinates;
    return {
      id: selectedEmergency._id,
      emergencyType: normalizeEmergencyType(selectedEmergency.emergencyType),
      status: selectedEmergency.status,
      source: selectedEmergency.source ?? null,
      lng,
      lat,
      notes: selectedEmergency.notes ?? null,
      reportedAt: selectedEmergency.reportedAt,
      barangayName: (selectedEmergency as any).barangayName ?? null,
    };
  }, [selectedEmergency]);

  // If the selected emergency becomes RESOLVED/CANCELLED, hide it (and close details).
  useEffect(() => {
    if (!selectedEmergencyId) return;
    if (selectedEmergency) return;

    setSelectedEmergencyId(null);
    setDetailsOpen(false);
    setDispatchModalOpen(false);
    setDispatchSelection([]);
    setTrackOpen(false);
  }, [selectedEmergencyId, selectedEmergency]);

  // Reset action panels when switching selected emergency
  useEffect(() => {
    setDispatchModalOpen(false);
    setDispatchSelection([]);
    setTrackOpen(false);
  }, [selectedEmergencyId]);

  const assignedResponderIds = useMemo(() => {
    if (!selectedEmergencyId) return [] as string[];
    return assignmentsByEmergency[selectedEmergencyId] ?? [];
  }, [assignmentsByEmergency, selectedEmergencyId]);

  const assignedResponders = useMemo(() => {
    return assignedResponderIds
      .map((id) => volunteers.find((v) => v.id === id))
      .filter(Boolean) as Volunteer[];
  }, [assignedResponderIds, volunteers]);

  // ✅ If user arrives from the dashboard (e.g., /lgu/live-map?emergencyId=...), auto-open details.
  useEffect(() => {
    if (!focusEmergencyId) {
      autoFocusedIdRef.current = null;
      autoFlewIdRef.current = null;
      return;
    }

    const found = activeReports.find((r) => String(r._id) === String(focusEmergencyId));
    if (!found) return;

    if (autoFocusedIdRef.current === String(focusEmergencyId)) return;
    autoFocusedIdRef.current = String(focusEmergencyId);
    autoFlewIdRef.current = null;

    // ensure emergencies are visible when deep-linking
    setShowEmergencies(true);

    // open details
    setSelectedEmergencyId(String(found._id));
    setDetailsOpen(true);
  }, [focusEmergencyId, activeReports]);

  // ✅ Fly to the focused emergency once the map is ready (separate effect)
  useEffect(() => {
    if (!focusEmergencyId) return;
    if (!mapReady) return;

    const found = activeReports.find((r) => String(r._id) === String(focusEmergencyId));
    if (!found) return;

    if (autoFlewIdRef.current === String(focusEmergencyId)) return;

    const coords = found.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords as [number, number];
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        flyTo(lng, lat, 15);
        autoFlewIdRef.current = String(focusEmergencyId);
      }
    }
  }, [focusEmergencyId, activeReports, mapReady]);

  // ✅ only mark ready after map load (prevents style-related nulls)
  // IMPORTANT: must be stable (useCallback) so EmergencyMap won't recreate the whole map on every render.
  const onMapReady = useCallback((m: mapboxgl.Map) => {
    mapRef.current = m;

    // if a new map instance gets attached, reset readiness until it's loaded
    setMapReady(false);

    const setReady = () => setMapReady(true);

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

  const flyTo = (lng: number, lat: number, zoom = 14) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, essential: true });
  };

  const centerDagupan = () => {
    mapRef.current?.flyTo({ center: DAGUPAN_CENTER, zoom: 12.6, essential: true });
  };

  const locateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      toastWarning("Geolocation is not supported on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;

        meMarkerRef.current?.remove();

        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "999px";
        el.style.background = "#2563eb";
        el.style.border = "2px solid rgba(255,255,255,0.95)";
        el.style.boxShadow = "0 12px 20px rgba(37, 99, 235, 0.25)";

        meMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        flyTo(lng, lat, 15);
      },
      () => toastWarning("Unable to get your location. Please enable location permission."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // volunteer markers overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    volunteerMarkersRef.current.forEach((m) => m.remove());
    volunteerMarkersRef.current = [];

    if (!showVolunteers) return;

    filteredVolunteers.forEach((v) => {
      // Skip map marker if volunteer has no coordinates yet
      if (!Number.isFinite(v.lng) || !Number.isFinite(v.lat)) return;
      const el = document.createElement("div");
      const color = colorForVolunteerStatus(v.status);

      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "999px";
      el.style.background = color;
      el.style.border = "2px solid rgba(255,255,255,0.95)";
      el.style.boxShadow = "0 10px 18px rgba(0,0,0,0.2)";
      el.style.cursor = "pointer";

      el.addEventListener("click", (ev) => ev.stopPropagation());

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
        .setLngLat([v.lng as number, v.lat as number])
        .setPopup(popup)
        .addTo(map);
      volunteerMarkersRef.current.push(marker);
    });

    return () => {
      volunteerMarkersRef.current.forEach((m) => m.remove());
      volunteerMarkersRef.current = [];
    };
  }, [filteredVolunteers, showVolunteers, mapReady]);

  useEffect(() => {
    return () => {
      volunteerMarkersRef.current.forEach((m) => m.remove());
      volunteerMarkersRef.current = [];
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
    };
  }, []);

  // hazards (saved): ensure layers + keep data after style switches
  useEffect(() => {
  const map = mapRef.current;
  if (!map || !mapReady) return;

  let cancelled = false;

  const apply = () => {
    if (cancelled) return;

    // ✅ if style still rebuilding, wait for idle then retry
    if (!map.isStyleLoaded()) {
      map.once("idle", apply);
      return;
    }

    try {
      ensureHazardZonesLayers(map);
      // ✅ only render ACTIVE hazards
      setHazardZonesData(map, activeHazardZones);
      setHazardZonesVisibility(map, showHazardZones);
    } catch (e) {
      // If style is rebuilding, try again once it becomes idle
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
}, [mapReady, activeHazardZones, showHazardZones]);

  // ✅ Native polygon drawing (Mapbox GL v3 compatible)
  useEffect(() => {
  const map = mapRef.current;
  if (!map || !mapReady) return;
  if (!isDrawingHazard) return;

  let active = true;
  let attached = false;

  const canvas = map.getCanvas();
  const prevCursor = canvas.style.cursor;

  const attach = () => {
    if (!active) return;
    if (!map.isStyleLoaded()) return;

    // make sure draft layers exist (no silent fail)
    ensureHazardDraftLayers(map);
    setHazardDraftVisibility(map, true);
    clearHazardDraft(map);
    setHazardDraftData(map, pointsRef.current, false);

    canvas.style.cursor = "crosshair";
    try {
      map.doubleClickZoom.disable();
    } catch {
      // ignore
    }

    const onClick = (ev: mapboxgl.MapMouseEvent) => {
      const p: [number, number] = [ev.lngLat.lng, ev.lngLat.lat];
      pointsRef.current = [...pointsRef.current, p];
      // ensure layers still exist (style switches)
      ensureHazardDraftLayers(map);
      setHazardDraftData(map, pointsRef.current, false);
    };

    const onDblClick = (ev: mapboxgl.MapMouseEvent) => {
      ev.preventDefault();

      if (pointsRef.current.length < 3) return;

      // finalize polygon draft
      setHazardDraftData(map, pointsRef.current, true);

      const ring = [...pointsRef.current, pointsRef.current[0]];
      setHazardDraft({
        geometry: { type: "Polygon", coordinates: [ring] },
      });

      setIsDrawingHazard(false);
      setLayersOpen(true);
    };

    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    attached = true;

    // cleanup handler refs stored on map instance (for cleanup)
    (map as any).__hazDraftClick = onClick;
    (map as any).__hazDraftDbl = onDblClick;
  };

  const idleCb = () => {
    if (!active) return;
    if (!map.isStyleLoaded()) return;
    map.off("idle", idleCb);
    attach();
  };

  if (!map.isStyleLoaded()) {
    map.on("idle", idleCb);
  } else {
    attach();
  }

  return () => {
    active = false;

    try {
      map.off("idle", idleCb);
    } catch {
      // ignore
    }

    if (attached) {
      const onClick = (map as any).__hazDraftClick;
      const onDbl = (map as any).__hazDraftDbl;
      if (onClick) map.off("click", onClick);
      if (onDbl) map.off("dblclick", onDbl);
      (map as any).__hazDraftClick = null;
      (map as any).__hazDraftDbl = null;
    }

    canvas.style.cursor = prevCursor;
    try {
      map.doubleClickZoom.enable();
    } catch {
      // ignore
    }
  };
}, [mapReady, isDrawingHazard]);

  const startDrawHazard = () => {
  const map = mapRef.current;
  if (!map) return;

  // reset
  setHazardDraft(null);
  setDraftForm({ name: "", hazardType: HAZARD_TYPES[0] });
  pointsRef.current = [];

  const begin = () => {
    if (!map.isStyleLoaded()) return;

    // create draft layers safely
    ensureHazardDraftLayers(map);
    setHazardDraftVisibility(map, true);
    clearHazardDraft(map);

    setIsDrawingHazard(true);
  };

  // if style is still loading (esp after switching map style), wait for idle
  if (!map.isStyleLoaded()) {
    map.once("idle", begin);
  } else {
    begin();
  }
};


  const cancelDrawHazard = () => {
  const map = mapRef.current;

  pointsRef.current = [];
  setIsDrawingHazard(false);
  setHazardDraft(null);

  if (map) {
    const clear = () => {
      if (!map.isStyleLoaded()) return;
      ensureHazardDraftLayers(map);
      clearHazardDraft(map);
      setHazardDraftVisibility(map, false);
      try {
        map.doubleClickZoom.enable();
      } catch {
        // ignore
      }
    };

    if (!map.isStyleLoaded()) map.once("idle", clear);
    else clear();
  }
};


  const saveHazardDraft = async () => {
    if (!hazardDraft) return;

    const name = draftForm.name.trim();
    if (!name) {
      toastWarning("Please enter a hazard zone name.");
      return;
    }

    try {
      await createHazardZone({
        name,
        hazardType: draftForm.hazardType,
        geometry: hazardDraft.geometry,
      });
    } catch (error: unknown) {
      const parsed = error as { message?: string; response?: { data?: { message?: string } } };
      toastError(parsed.response?.data?.message || parsed.message || "Failed to save hazard zone.");
      return;
    }

    const map = mapRef.current;
    pointsRef.current = [];
    setHazardDraft(null);
    setIsDrawingHazard(false);

    if (map) {
      try {
        clearHazardDraft(map);
        setHazardDraftVisibility(map, false);
      } catch {
        // ignore
      }
    }

    await refetchHazardZones();
    toastSuccess("Hazard zone saved.");
  };

  const onEmergencyPinClick = useCallback((pin: MapEmergencyPin) => {
    setSelectedEmergencyId(pin.id);
    setDetailsOpen(true);
    flyTo(pin.lng, pin.lat, 15);
  }, []);

  // ✅ Fully close details (no minimize tab)
  const cleanupDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelectedEmergencyId(null);
    setDispatchModalOpen(false);
    setDispatchSelection([]);
    setTrackOpen(false);
  }, []);

  // ✅ Clicking empty map closes the details panel entirely
  const onMapClick = useCallback(() => {
    if (isDrawingHazard) return;
    cleanupDetails();
  }, [isDrawingHazard, cleanupDetails]);

  const openDispatchResponders = useCallback(() => {
    if (!selectedEmergencyDetails) return;

    const available = volunteers.filter((v) => v.status === "available");
    if (available.length === 0) {
      toastWarning("No available responders right now.");
      return;
    }

    // Preselect nearest 2 available responders (only if nothing is selected yet)
    setDispatchSelection((prev) => {
      if (prev.length) return prev;
      const withCoords = available.filter((v) => Number.isFinite(v.lng) && Number.isFinite(v.lat));
      if (withCoords.length) {
        const sorted = [...withCoords].sort((a, b) => {
          const da = ((a.lng as number) - selectedEmergencyDetails.lng) ** 2 + ((a.lat as number) - selectedEmergencyDetails.lat) ** 2;
          const db = ((b.lng as number) - selectedEmergencyDetails.lng) ** 2 + ((b.lat as number) - selectedEmergencyDetails.lat) ** 2;
          return da - db;
        });
        return sorted.slice(0, 2).map((v) => v.id);
      }
      // fallback if no coordinates exist yet
      return available.slice(0, 2).map((v) => v.id);
    });

    setDispatchModalOpen(true);
  }, [selectedEmergencyDetails, volunteers]);

  const closeDispatchResponders = useCallback(() => {
    setDispatchModalOpen(false);
    setDispatchSelection([]);
  }, []);

  const toggleDispatchResponder = useCallback(
    (volunteerId: string) => {
      const v = volunteers.find((x) => x.id === volunteerId);
      if (!v || v.status !== "available") return;

      setDispatchSelection((prev) =>
        prev.includes(volunteerId)
          ? prev.filter((id) => id !== volunteerId)
          : [...prev, volunteerId]
      );
    },
    [volunteers]
  );

  const confirmDispatchResponders = useCallback(async () => {
    if (!selectedEmergencyId) return;

    const availableSet = new Set(
      volunteers.filter((v) => v.status === "available").map((v) => v.id)
    );
    const chosen = dispatchSelection.filter((id) => availableSet.has(id));

    if (chosen.length === 0) {
      toastWarning("Select at least one available responder.");
      return;
    }

    // ✅ Persist dispatch offers to the backend (web → backend → mobile)
    try {
      await createDispatchOffers({ emergencyId: selectedEmergencyId, volunteerIds: chosen });
    } catch (error: unknown) {
      const parsed = error as { message?: string; response?: { data?: { message?: string } } };
      toastError(parsed.response?.data?.message ?? parsed.message ?? "Failed to dispatch responders.");
      return;
    }
    appendActivityLog({
      action: "Dispatched volunteers",
      entityType: "dispatch",
      entityId: selectedEmergencyId,
      metadata: {
        volunteerIds: chosen,
        volunteerCount: chosen.length,
      },
    });

    setAssignmentsByEmergency((prev) => {
      const existing = prev[selectedEmergencyId] ?? [];
      const merged = Array.from(new Set([...existing, ...chosen]));
      return { ...prev, [selectedEmergencyId]: merged };
    });

    // Mark dispatched responders as busy (mock behavior)
    setVolunteers((prev) =>
      prev.map((v) => (chosen.includes(v.id) ? { ...v, status: "busy" } : v))
    );

    setDispatchModalOpen(false);
    setDispatchSelection([]);
    setTrackOpen(true);
    toastSuccess("Responders dispatched.");
  }, [dispatchSelection, selectedEmergencyId, volunteers]);

  const toggleTrackPanel = useCallback(() => {
    setTrackOpen((v) => !v);
  }, []);

  const centerOnResponder = useCallback(
    (volunteerId: string) => {
      const v = volunteers.find((x) => x.id === volunteerId);
      if (!v) return;
      if (!Number.isFinite(v.lng) || !Number.isFinite(v.lat)) {
        toastWarning("This responder has no live location yet.");
        return;
      }
      flyTo(v.lng as number, v.lat as number, 15);
    },
    [volunteers, flyTo]
  );

  // ✅ persisted on/off status
  const toggleHazardZoneItem = async (id: string) => {
    const z = (hazardZones ?? []).find((x: any) => String(x._id) === String(id));
    if (!z) return;
    const current = (z as any).isActive !== false; // missing field => treat as true
    await setHazardZoneStatus(String(id), !current);
  };

  const deleteHazardZoneItem = async (id: string) => {
    const ok = await confirm({
      title: "Are you sure you want to delete?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await removeHazardZone(id);
      await refetchHazardZones();
      toastSuccess("Hazard zone deleted.");
    } catch (error: unknown) {
      const parsed = error as { message?: string; response?: { data?: { message?: string } } };
      toastError(parsed.response?.data?.message || parsed.message || "Failed to delete hazard zone.");
    }
  };

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchEmergencies(), refetchHazardZones(), refetchVolunteers()]);
  }, [refetchEmergencies, refetchHazardZones, refetchVolunteers]);

  const loading = emergenciesLoading || hazardZonesLoading || volunteersLoading;
  const error = emergenciesError || hazardZonesError || volunteersError || null;

  return {
    loading,
    error,
    onRefresh,
    mapReady,
    onMapReady,
    mapStyleKey,
    setMapStyleKey,
    mapStyleUrl: MAP_STYLE_URL[mapStyleKey],
    center: DAGUPAN_CENTER,
    centerDagupan,
    locateMe,
    flyTo,

    query,
    setQuery,

    layersOpen,
    setLayersOpen,

    showEmergencies,
    setShowEmergencies,
    showVolunteers,
    setShowVolunteers,
    showHazardZones,
    setShowHazardZones,

    emergencyPins,
    emergenciesLoading,
    emergenciesError,
    refetchEmergencies,
    onEmergencyPinClick,
    onMapClick,

    selectedEmergencyDetails,
    detailsOpen,
    setDetailsOpen,
    cleanupDetails,

    // responders dispatch + tracking (live map only)
    volunteers,
    volunteersLoading,
    volunteersError,
    refetchVolunteers,
    dispatchModalOpen,
    openDispatchResponders,
    closeDispatchResponders,
    dispatchSelection,
    toggleDispatchResponder,
    confirmDispatchResponders,
    trackOpen,
    toggleTrackPanel,
    assignedResponders,
    centerOnResponder,

    // show active hazards count in pills (matches what's shown on the map)
    hazardsCount: hazardsActiveCount,
    hazardsTotalCount,
    volunteersCount: volunteers.length,
    emergenciesCount: activeReports.length,

    // hazard zones list + per-zone controls (dropdown)
    hazardZones,
    toggleHazardZoneItem,
    deleteHazardZoneItem,

    hazardZonesLoading,
    hazardZonesError,
    refetchHazardZones,

    isDrawingHazard,
    startDrawHazard,
    cancelDrawHazard,
    hazardDraft,
    draftForm,
    setDraftForm,
    saveHazardDraft,
  };
}
