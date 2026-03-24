import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useSearchParams } from "react-router-dom";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/services/feedback/toast.service";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

import type { MapEmergencyPin } from "../../emergency/components/EmergencyMap";
import { normalizeEmergencyType } from "../../emergency/constants/emergency.constants";
import { useLguEmergencies } from "../../emergency/hooks/useLguEmergencies";
import type { DispatchTask } from "../../tasks/models/tasks.types";

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
  HAZARD_DRAFT_POINTS_LAYER_ID,
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
import { createDispatchOffers, fetchDispatchTasks } from "../services/dispatch.service";
import { fetchDispatchVolunteers } from "../services/volunteers.service";
import { getLguUser } from "../../auth/services/authStorage";
import { createLivePresenceSocket } from "../services/livePresence.socket";
import {
  createNotificationsSocket,
  type NotificationsRefreshPayload,
} from "../../notifications/services/notifications.socket";

type LngLat = [number, number];

function toFiniteLngLat(value: unknown): LngLat | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = typeof value[0] === "string" ? Number(value[0]) : value[0];
  const lat = typeof value[1] === "string" ? Number(value[1]) : value[1];
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function collectGeometryLngLats(node: unknown, out: LngLat[]) {
  const pair = toFiniteLngLat(node);
  if (pair) {
    out.push(pair);
    return;
  }
  if (!Array.isArray(node)) return;
  node.forEach((item) => collectGeometryLngLats(item, out));
}

function getHazardGeometryPoints(geometry: unknown): LngLat[] {
  if (!geometry || typeof geometry !== "object") return [];
  const coordinates = (geometry as { coordinates?: unknown }).coordinates;
  const points: LngLat[] = [];
  collectGeometryLngLats(coordinates, points);
  return points;
}

function spreadOverlappingEmergencyPins(pins: MapEmergencyPin[]) {
  if (pins.length <= 1) return pins;

  const grouped = new Map<string, MapEmergencyPin[]>();
  pins.forEach((pin) => {
    const key = `${pin.lng.toFixed(6)},${pin.lat.toFixed(6)}`;
    const group = grouped.get(key);
    if (group) group.push(pin);
    else grouped.set(key, [pin]);
  });

  return pins.map((pin) => {
    const key = `${pin.lng.toFixed(6)},${pin.lat.toFixed(6)}`;
    const group = grouped.get(key);
    if (!group || group.length <= 1) return pin;

    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const index = sorted.findIndex((item) => item.id === pin.id);
    if (index <= 0) return pin; // keep one marker at exact coordinate

    const orbitIndex = index - 1;
    const ring = Math.floor(orbitIndex / 8);
    const pos = orbitIndex % 8;
    const ringSize = Math.min(8, Math.max(1, sorted.length - 1 - ring * 8));
    const angle = (Math.PI * 2 * pos) / ringSize;
    const radiusDeg = 0.00015 + ring * 0.0001;
    const latOffset = radiusDeg * Math.sin(angle);
    const lngScale = Math.max(Math.cos((pin.lat * Math.PI) / 180), 0.2);
    const lngOffset = (radiusDeg * Math.cos(angle)) / lngScale;

    return {
      ...pin,
      lng: pin.lng + lngOffset,
      lat: pin.lat + latOffset,
    };
  });
}

function emergencyCoordsFromReport(report: unknown): LngLat | null {
  const maybeReport = report as {
    location?: {
      coordinates?: unknown;
      coords?: { longitude?: unknown; latitude?: unknown };
      longitude?: unknown;
      latitude?: unknown;
    };
  };

  const fromCoordinates = toFiniteLngLat(maybeReport?.location?.coordinates);
  if (fromCoordinates) return fromCoordinates;

  const lng = Number(
    maybeReport?.location?.coords?.longitude ??
      maybeReport?.location?.longitude ??
      Number.NaN
  );
  const lat = Number(
    maybeReport?.location?.coords?.latitude ??
      maybeReport?.location?.latitude ??
      Number.NaN
  );
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function emergencyLocationTextFromReport(report: unknown) {
  const maybeReport = report as {
    locationLabel?: unknown;
    barangayName?: unknown;
    barangayCity?: unknown;
    barangayProvince?: unknown;
  };

  const exactLabel = String(maybeReport?.locationLabel ?? "").trim();
  if (exactLabel) return exactLabel;

  const coords = emergencyCoordsFromReport(report);
  if (coords) {
    const [lng, lat] = coords;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  const locationBits = [
    maybeReport?.barangayName,
    maybeReport?.barangayCity,
    maybeReport?.barangayProvince,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  if (locationBits.length > 0) return locationBits.join(", ");

  return "Unknown location";
}

function isResolvedEmergencyStatus(raw?: string) {
  const up = String(raw ?? "").toUpperCase();
  return (
    up === "RESOLVED" ||
    up === "CANCELLED" ||
    up === "COMPLETED" ||
    up === "DONE" ||
    up === "VERIFIED"
  );
}

function isRejectedEmergencyReport(report: unknown) {
  const verificationStatus = String(
    (report as { verification?: { status?: string } } | null | undefined)?.verification?.status ?? ""
  )
    .trim()
    .toLowerCase();
  return verificationStatus === "rejected";
}

function isHiddenEmergencyReport(report: unknown) {
  const visibility = (report as { visibility?: { isVisibleOnMap?: boolean } } | null | undefined)?.visibility
    ?.isVisibleOnMap;
  return visibility === false;
}

function toVolunteerStatusFromPresence(raw?: string): Volunteer["status"] {
  const status = String(raw ?? "").trim().toUpperCase();
  if (status === "BUSY") return "busy";
  if (status === "IDLE") return "idle";
  if (status === "ONLINE") return "available";
  return "offline";
}

function volunteerPresenceLabel(statusRaw: Volunteer["status"]) {
  if (statusRaw === "busy") return "BUSY";
  if (statusRaw === "idle") return "IDLE";
  return "ONLINE";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureVolunteerPinStyles() {
  const styleId = "ll-live-map-volunteer-pin-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    .ll-vol-pin-wrap {
      position: relative;
      width: 68px;
      height: 68px;
      --ll-vol-color: #22c55e;
      pointer-events: auto;
    }

    .ll-vol-pin-core {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      transform: translate(-50%, -50%);
      border: 0;
      background: transparent;
      overflow: hidden;
      box-shadow: 0 0 0 2px var(--ll-vol-color), 0 6px 14px rgba(0, 0, 0, 0.24);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .ll-vol-pin-center {
      width: 100%;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
      overflow: hidden;
      background: transparent;
    }

    .ll-vol-pin-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: inherit;
    }

    .ll-vol-pin-fallback {
      width: 100%;
      height: 100%;
      color: var(--ll-vol-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.96);
    }

    .ll-vol-pin-icon {
      width: 16px;
      height: 16px;
      display: block;
    }

    .ll-vol-pin-chip {
      position: absolute;
      left: 50%;
      top: -10px;
      transform: translateX(-50%);
      border-radius: 999px;
      padding: 2px 7px;
      background: rgba(15, 23, 42, 0.9);
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
      white-space: nowrap;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
      z-index: 3;
    }

    .ll-vol-pin-wrap[data-status="busy"] .ll-vol-pin-chip {
      background: rgba(234, 88, 12, 0.92);
    }

    .ll-vol-pin-wrap[data-status="available"] .ll-vol-pin-chip {
      background: rgba(22, 163, 74, 0.92);
    }

    .ll-vol-pin-wrap[data-status="idle"] .ll-vol-pin-chip {
      background: rgba(51, 65, 85, 0.92);
    }
  `;

  document.head.appendChild(style);
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
  const volunteerStatusByIdRef = useRef<Map<string, Volunteer["status"]>>(new Map());
  const volunteerNameByIdRef = useRef<Map<string, string>>(new Map());
  const lastVolunteerOnlineToastAtRef = useRef<Map<string, number>>(new Map());
  const draggingDraftVertexIdxRef = useRef<number | null>(null);
  const suppressNextMapClickRef = useRef(false);
  const dragPanWasEnabledRef = useRef(false);

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
  const [selectedEmergencyTasks, setSelectedEmergencyTasks] = useState<DispatchTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // hazard draw + save form
  const [isDrawingHazard, setIsDrawingHazard] = useState(false);
  const pointsRef = useRef<LngLat[]>([]);
  const [hazardPointCount, setHazardPointCount] = useState(0);

  const [hazardDraft, setHazardDraft] = useState<HazardDraft | null>(null);
  const [draftForm, setDraftForm] = useState<HazardDraftFormState>({
    name: "",
    hazardType: HAZARD_TYPES[0],
  });

  // data
  const {
    reports,
    completedEmergencyIds,
    loading: emergenciesLoading,
    error: emergenciesError,
    refetch: refetchEmergencies,
  } = useLguEmergencies();

  const activeReports = useMemo(() => {
    return (reports ?? []).filter((report) => {
      if (isResolvedEmergencyStatus(report.status)) return false;
      if (isRejectedEmergencyReport(report)) return false;
      if (isHiddenEmergencyReport(report)) return false;
      return !completedEmergencyIds.has(String(report._id));
    });
  }, [reports, completedEmergencyIds]);

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

  useEffect(() => {
    const statusById = volunteerStatusByIdRef.current;
    const nameById = volunteerNameByIdRef.current;
    for (const volunteer of volunteers) {
      statusById.set(volunteer.id, volunteer.status);
      nameById.set(volunteer.id, volunteer.name);
    }
  }, [volunteers]);

  useEffect(() => {
    const user = getLguUser();
    if (!user?.id) return;

    const socket = createLivePresenceSocket();

    const mergePresence = (
      volunteerIdRaw: unknown,
      patch: Partial<Volunteer>,
      options?: { remove?: boolean }
    ) => {
      const volunteerId = String(volunteerIdRaw ?? "").trim();
      if (!volunteerId) return;

      setVolunteers((prev) => {
        if (options?.remove) {
          return prev.map((volunteer) =>
            volunteer.id === volunteerId ? { ...volunteer, ...patch, status: "offline" } : volunteer
          );
        }

        const index = prev.findIndex((volunteer) => volunteer.id === volunteerId);
        if (index === -1) {
          return [
            ...prev,
            {
              id: volunteerId,
              name: "Volunteer",
              skill: "General Volunteer",
              status: patch.status ?? "available",
              ...patch,
            },
          ];
        }

        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
    };

    const onSnapshot = (payload: {
      volunteers?: Array<{
        volunteerId?: string;
        status?: string;
        lastSeenAt?: string;
        lastLocation?: { lng?: number; lat?: number };
      }>;
    }) => {
      const byId = new Map<
        string,
        {
          volunteerId?: string;
          status?: string;
          lastSeenAt?: string;
          lastLocation?: { lng?: number; lat?: number };
        }
      >();

      (payload?.volunteers ?? []).forEach((entry) => {
        const volunteerId = String(entry?.volunteerId ?? "").trim();
        if (!volunteerId) return;
        byId.set(volunteerId, entry);
      });

      setVolunteers((prev) =>
        prev.map((volunteer) => {
          const matched = byId.get(volunteer.id);
          if (!matched) return { ...volunteer, status: "offline" };

          const lng = Number(matched.lastLocation?.lng);
          const lat = Number(matched.lastLocation?.lat);

          return {
            ...volunteer,
            status: toVolunteerStatusFromPresence(matched.status),
            lastSeenAt: matched.lastSeenAt ?? volunteer.lastSeenAt,
            ...(Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : {}),
          };
        })
      );
    };

    const onPresenceChanged = (payload: {
      volunteer?: {
        volunteerId?: string;
        status?: string;
        lastSeenAt?: string;
        lastLocation?: { lng?: number; lat?: number };
      };
    }) => {
      const volunteerId = String(payload?.volunteer?.volunteerId ?? "").trim();
      const status = String(payload?.volunteer?.status ?? "").trim().toUpperCase();
      if (!volunteerId) return;

      const prevStatus = volunteerStatusByIdRef.current.get(volunteerId);

      if (status === "OFFLINE") {
        volunteerStatusByIdRef.current.set(volunteerId, "offline");
        mergePresence(
          volunteerId,
          {
            lastSeenAt: payload?.volunteer?.lastSeenAt,
          },
          { remove: true }
        );
        return;
      }

      const nextStatus = toVolunteerStatusFromPresence(status);
      volunteerStatusByIdRef.current.set(volunteerId, nextStatus);

      const lng = Number(payload?.volunteer?.lastLocation?.lng);
      const lat = Number(payload?.volunteer?.lastLocation?.lat);

      mergePresence(volunteerId, {
        status: nextStatus,
        lastSeenAt: payload?.volunteer?.lastSeenAt,
        ...(Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : {}),
      });

      const shouldNotifyOnline =
        nextStatus === "available" &&
        (prevStatus === "offline" || prevStatus === "idle");
      if (shouldNotifyOnline) {
        const now = Date.now();
        const lastToastAt = lastVolunteerOnlineToastAtRef.current.get(volunteerId) ?? 0;
        if (now - lastToastAt >= 30_000) {
          lastVolunteerOnlineToastAtRef.current.set(volunteerId, now);
          const volunteerName = volunteerNameByIdRef.current.get(volunteerId) || "Volunteer";
          toastInfo(`${volunteerName} is now online`);
        }
      }
    };

    const onLocationUpdate = (payload: {
      volunteer?: {
        volunteerId?: string;
        status?: string;
        location?: { lng?: number; lat?: number };
      };
    }) => {
      const volunteerId = String(payload?.volunteer?.volunteerId ?? "").trim();
      if (!volunteerId) return;

      const lng = Number(payload?.volunteer?.location?.lng);
      const lat = Number(payload?.volunteer?.location?.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      mergePresence(volunteerId, {
        status: toVolunteerStatusFromPresence(payload?.volunteer?.status),
        lng,
        lat,
      });
    };

    const subscribe = () => {
      socket.emit("volunteers:subscribe", {
        lng: DAGUPAN_CENTER[0],
        lat: DAGUPAN_CENTER[1],
        radiusKm: 20,
      });
    };

    socket.on("volunteers:snapshot", onSnapshot);
    socket.on("volunteers:presence_changed", onPresenceChanged);
    socket.on("volunteers:location_update", onLocationUpdate);
    socket.on("connect", subscribe);

    socket.connect();
    if (socket.connected) subscribe();

    return () => {
      socket.emit("volunteers:unsubscribe");
      socket.off("volunteers:snapshot", onSnapshot);
      socket.off("volunteers:presence_changed", onPresenceChanged);
      socket.off("volunteers:location_update", onLocationUpdate);
      socket.off("connect", subscribe);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const user = getLguUser();
    if (!user?.id) return;

    let lastRefreshAt = 0;
    const socket = createNotificationsSocket();

    const onRefresh = (payload: NotificationsRefreshPayload) => {
      const now = Date.now();
      if (now - lastRefreshAt < 1000) return;
      lastRefreshAt = now;

      const reason = String(payload?.reason ?? "").trim().toLowerCase();
      if (reason === "emergency_reported") {
        toastInfo("New emergency reported");
      }

      void refetchEmergencies();
      void refetchVolunteers();
    };

    socket.on("notifications:refresh", onRefresh);
    socket.connect();

    return () => {
      socket.off("notifications:refresh", onRefresh);
      socket.disconnect();
    };
  }, [refetchEmergencies, refetchVolunteers]);

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

  const availableVolunteersCount = useMemo(() => {
    return volunteers.filter((v) => String(v.status ?? "").toLowerCase() === "available").length;
  }, [volunteers]);

  const activeVolunteersCount = useMemo(() => {
    return volunteers.filter((v) => String(v.status ?? "").toLowerCase() !== "offline").length;
  }, [volunteers]);

  const sosCount = useMemo(() => {
    return activeReports.filter((r) => normalizeEmergencyType(r.emergencyType) === "SOS").length;
  }, [activeReports]);

  const liveIncidents = useMemo(() => {
    const sorted = [...activeReports].sort((a, b) => {
      const ta = a?.reportedAt ? new Date(a.reportedAt).getTime() : 0;
      const tb = b?.reportedAt ? new Date(b.reportedAt).getTime() : 0;
      return tb - ta;
    });

    return sorted.slice(0, 12).map((r) => ({
      id: String(r._id),
      emergencyType: normalizeEmergencyType(r.emergencyType),
      status: String(r.status ?? ""),
      locationText: emergencyLocationTextFromReport(r),
      source: r.source ?? null,
      reportedAt: r.reportedAt,
    }));
  }, [activeReports]);

  const emergencyPins: MapEmergencyPin[] = useMemo(() => {
    if (!showEmergencies) return [];
    const mapped = activeReports.flatMap((report) => {
      const coords = emergencyCoordsFromReport(report);
      if (!coords) return [];

      const [lng, lat] = coords;
      return [
        {
          id: String(report._id),
          type: normalizeEmergencyType(report.emergencyType),
          lng,
          lat,
        } satisfies MapEmergencyPin,
      ];
    });

    return spreadOverlappingEmergencyPins(mapped);
  }, [activeReports, showEmergencies]);

  const selectedEmergency = useMemo(() => {
    if (!selectedEmergencyId) return undefined;
    return activeReports.find((r) => r._id === selectedEmergencyId);
  }, [activeReports, selectedEmergencyId]);

  const selectedEmergencyDetails: LguEmergencyDetails | null = useMemo(() => {
    if (!selectedEmergency) return null;
    const coords = emergencyCoordsFromReport(selectedEmergency);
    if (!coords) return null;
    const [lng, lat] = coords;
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

  useEffect(() => {
    if (!detailsOpen || !selectedEmergencyId) {
      setSelectedEmergencyTasks([]);
      setTasksLoading(false);
      setTasksError(null);
      return;
    }

    let cancelled = false;
    setSelectedEmergencyTasks([]);
    setTasksLoading(true);
    setTasksError(null);

    fetchDispatchTasks({
      emergencyId: selectedEmergencyId,
    })
      .then((tasks) => {
        if (cancelled) return;
        setSelectedEmergencyTasks(Array.isArray(tasks) ? tasks : []);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setSelectedEmergencyTasks([]);
        setTasksError(err?.response?.data?.message ?? err?.message ?? "Failed to load dispatch tasks");
      })
      .finally(() => {
        if (cancelled) return;
        setTasksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailsOpen, selectedEmergencyId]);

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
    setSelectedEmergencyTasks([]);
    setTasksError(null);
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
    setLayersOpen(false);
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

  const zoomToSelectedEmergency = useCallback(() => {
    if (!selectedEmergencyDetails) return;
    flyTo(selectedEmergencyDetails.lng, selectedEmergencyDetails.lat, 15);
  }, [selectedEmergencyDetails]);

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

  const redrawDraftOpenPolygon = useCallback((map: mapboxgl.Map) => {
    if (!map.isStyleLoaded()) return;
    ensureHazardDraftLayers(map);
    setHazardDraftData(map, pointsRef.current, false, draggingDraftVertexIdxRef.current);
    setHazardPointCount(pointsRef.current.length);
  }, []);

  // volunteer markers overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    ensureVolunteerPinStyles();

    volunteerMarkersRef.current.forEach((m) => m.remove());
    volunteerMarkersRef.current = [];

    if (!showVolunteers) return;

    filteredVolunteers.forEach((v) => {
      // Skip map marker if volunteer has no coordinates yet
      if (!Number.isFinite(v.lng) || !Number.isFinite(v.lat)) return;
      if (String(v.status ?? "").toLowerCase() === "offline") return;

      const el = document.createElement("div");
      const color = colorForVolunteerStatus(v.status);
      const statusText = volunteerPresenceLabel(v.status);
      const volunteerAddress = [v.barangayName, v.municipality].filter(Boolean).join(", ");
      const displayAddress = volunteerAddress || "Address unavailable";
      const popupName = escapeHtml(v.name);
      const popupAddress = escapeHtml(displayAddress);
      const popupSkill = escapeHtml(v.skill || "General Volunteer");
      const popupStatus = escapeHtml(v.status.toUpperCase());
      const avatarUrl = String(v.avatarUrl ?? "").trim();
      const hasAvatar = avatarUrl.length > 0;
      const safeAvatarUrl = escapeHtml(avatarUrl);

      el.className = "ll-vol-pin-wrap";
      el.dataset.status = String(v.status ?? "").toLowerCase();
      el.style.setProperty("--ll-vol-color", color);
      el.style.cursor = "pointer";
      el.innerHTML = `
        <div class="ll-vol-pin-chip">${statusText}</div>
        <div class="ll-vol-pin-core">
          <span class="ll-vol-pin-center" aria-hidden="true">
            ${
              hasAvatar
                ? `<img class="ll-vol-pin-avatar" src="${safeAvatarUrl}" alt="" loading="lazy" />`
                : ""
            }
            <span class="ll-vol-pin-fallback"${hasAvatar ? ' style="display:none;"' : ""}>
              <svg class="ll-vol-pin-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="2"></circle>
                <path d="M5 19c1.2-3 3.8-4.5 7-4.5s5.8 1.5 7 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
            </span>
          </span>
        </div>
      `;

      if (hasAvatar) {
        const avatarImage = el.querySelector<HTMLImageElement>(".ll-vol-pin-avatar");
        const fallbackIcon = el.querySelector<HTMLElement>(".ll-vol-pin-fallback");
        if (avatarImage && fallbackIcon) {
          avatarImage.addEventListener(
            "error",
            () => {
              avatarImage.style.display = "none";
              fallbackIcon.style.display = "inline-flex";
            },
            { once: true }
          );
        }
      }

      const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(`
        <div style="font-family: ui-sans-serif; min-width: 220px;">
          <div style="font-weight: 800; color: #111827; font-size: 14px;">${popupName}</div>
          <div style="margin-top: 6px; color: #6b7280; font-size: 12px;">Address: ${popupAddress}</div>
          <div style="margin-top: 4px; color: #6b7280; font-size: 12px;">Skill: ${popupSkill}</div>
          <div style="margin-top: 10px; display:inline-flex; gap:8px; align-items:center;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${color};"></span>
            <span style="font-size:12px;color:#374151;font-weight:700;">${popupStatus}</span>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([v.lng as number, v.lat as number])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        marker.togglePopup();
      });
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
      draggingDraftVertexIdxRef.current = null;
      suppressNextMapClickRef.current = false;
      dragPanWasEnabledRef.current = false;
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

  // Native polygon drawing (Mapbox GL v3 compatible)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!isDrawingHazard) return;

    let active = true;
    let attached = false;
    let onClickHandler: ((ev: mapboxgl.MapMouseEvent) => void) | null = null;
    let onContextMenuHandler: ((ev: mapboxgl.MapMouseEvent) => void) | null = null;
    let onDblClickHandler: ((ev: mapboxgl.MapMouseEvent) => void) | null = null;
    let onMouseMoveHandler: ((ev: mapboxgl.MapMouseEvent) => void) | null = null;
    let onMouseUpHandler: ((ev: mapboxgl.MapMouseEvent) => void) | null = null;
    let onPointMouseDownHandler: ((ev: mapboxgl.MapMouseEvent & { features?: unknown[] }) => void) | null = null;

    const canvas = map.getCanvas();
    const prevCursor = canvas.style.cursor;
    const setDrawCursor = () => {
      canvas.style.cursor = draggingDraftVertexIdxRef.current !== null ? "grabbing" : "crosshair";
    };

    const getDraftPointIdx = (value: unknown): number | null => {
      const idx = typeof value === "number" ? value : Number(value);
      if (!Number.isInteger(idx) || idx < 0 || idx >= pointsRef.current.length) return null;
      return idx;
    };

    const removeDraftPoint = (idx: number) => {
      if (idx < 0 || idx >= pointsRef.current.length) return;
      pointsRef.current = pointsRef.current.filter((_, i) => i !== idx);

      const draggingIdx = draggingDraftVertexIdxRef.current;
      if (draggingIdx !== null) {
        if (draggingIdx === idx) draggingDraftVertexIdxRef.current = null;
        else if (draggingIdx > idx) draggingDraftVertexIdxRef.current = draggingIdx - 1;
      }

      redrawDraftOpenPolygon(map);
      setDrawCursor();
    };

    const attach = () => {
      if (!active) return;
      if (!map.isStyleLoaded()) return;

      // make sure draft layers exist (no silent fail)
      ensureHazardDraftLayers(map);
      setHazardDraftVisibility(map, true);
      clearHazardDraft(map);
      redrawDraftOpenPolygon(map);

      setDrawCursor();
      try {
        map.doubleClickZoom.disable();
      } catch {
        // ignore
      }

      const onClick = (ev: mapboxgl.MapMouseEvent) => {
        if (suppressNextMapClickRef.current) {
          suppressNextMapClickRef.current = false;
          return;
        }

        const p: [number, number] = [ev.lngLat.lng, ev.lngLat.lat];
        pointsRef.current = [...pointsRef.current, p];
        redrawDraftOpenPolygon(map);
      };

      const onPointMouseDown = (ev: mapboxgl.MapMouseEvent & { features?: unknown[] }) => {
        const rawIdx = (
          ev.features?.[0] as { properties?: { idx?: unknown } } | undefined
        )?.properties?.idx;
        const idx = getDraftPointIdx(rawIdx);
        if (idx === null) return;

        ev.preventDefault();
        ev.originalEvent.preventDefault();
        ev.originalEvent.stopPropagation();

        draggingDraftVertexIdxRef.current = idx;
        dragPanWasEnabledRef.current = !!map.dragPan.isEnabled();
        if (dragPanWasEnabledRef.current) map.dragPan.disable();
        setDrawCursor();
      };

      const onMouseMove = (ev: mapboxgl.MapMouseEvent) => {
        const idx = draggingDraftVertexIdxRef.current;
        if (idx === null) return;
        if (idx < 0 || idx >= pointsRef.current.length) return;

        const next = [...pointsRef.current];
        next[idx] = [ev.lngLat.lng, ev.lngLat.lat];
        pointsRef.current = next;
        redrawDraftOpenPolygon(map);
      };

      const onMouseUp = (_ev: mapboxgl.MapMouseEvent) => {
        const idx = draggingDraftVertexIdxRef.current;
        if (idx === null) return;

        draggingDraftVertexIdxRef.current = null;
        suppressNextMapClickRef.current = true;

        if (dragPanWasEnabledRef.current) map.dragPan.enable();
        dragPanWasEnabledRef.current = false;

        redrawDraftOpenPolygon(map);
        setDrawCursor();
      };

      const onContextMenu = (ev: mapboxgl.MapMouseEvent) => {
        ev.preventDefault();
        ev.originalEvent.preventDefault();
        ev.originalEvent.stopPropagation();
        if (draggingDraftVertexIdxRef.current !== null) return;

        if (!map.getLayer(HAZARD_DRAFT_POINTS_LAYER_ID)) return;

        const hits = map.queryRenderedFeatures(ev.point, {
          layers: [HAZARD_DRAFT_POINTS_LAYER_ID],
        });
        const feature = hits[0];
        const idx = getDraftPointIdx(feature?.properties?.idx);
        if (idx === null) return;

        removeDraftPoint(idx);
      };

      const onDblClick = (ev: mapboxgl.MapMouseEvent) => {
        ev.preventDefault();

        if (pointsRef.current.length < 3) return;

        draggingDraftVertexIdxRef.current = null;
        suppressNextMapClickRef.current = false;
        if (dragPanWasEnabledRef.current) map.dragPan.enable();
        dragPanWasEnabledRef.current = false;
        setDrawCursor();

        // finalize polygon draft
        setHazardDraftData(map, pointsRef.current, true);

        const ring = [...pointsRef.current, pointsRef.current[0]];
        setHazardDraft({
          geometry: { type: "Polygon", coordinates: [ring] },
        });
        setHazardPointCount(pointsRef.current.length);

        setIsDrawingHazard(false);
        setLayersOpen(true);
      };

      map.on("click", onClick);
      map.on("contextmenu", onContextMenu);
      map.on("mousedown", HAZARD_DRAFT_POINTS_LAYER_ID, onPointMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
      map.on("dblclick", onDblClick);
      attached = true;
      onClickHandler = onClick;
      onContextMenuHandler = onContextMenu;
      onPointMouseDownHandler = onPointMouseDown;
      onMouseMoveHandler = onMouseMove;
      onMouseUpHandler = onMouseUp;
      onDblClickHandler = onDblClick;
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
        if (onClickHandler) map.off("click", onClickHandler);
        if (onContextMenuHandler) map.off("contextmenu", onContextMenuHandler);
        if (onPointMouseDownHandler) map.off("mousedown", HAZARD_DRAFT_POINTS_LAYER_ID, onPointMouseDownHandler);
        if (onMouseMoveHandler) map.off("mousemove", onMouseMoveHandler);
        if (onMouseUpHandler) map.off("mouseup", onMouseUpHandler);
        if (onDblClickHandler) map.off("dblclick", onDblClickHandler);
      }

      draggingDraftVertexIdxRef.current = null;
      suppressNextMapClickRef.current = false;
      dragPanWasEnabledRef.current = false;

      canvas.style.cursor = prevCursor;
      try {
        if (!map.dragPan.isEnabled()) map.dragPan.enable();
        map.doubleClickZoom.enable();
      } catch {
        // ignore
      }
    };
  }, [mapReady, isDrawingHazard, redrawDraftOpenPolygon]);

  const startDrawHazard = () => {
  const map = mapRef.current;
  if (!map) return;

  // reset
  draggingDraftVertexIdxRef.current = null;
  suppressNextMapClickRef.current = false;
  dragPanWasEnabledRef.current = false;
  setHazardDraft(null);
  setDraftForm({ name: "", hazardType: HAZARD_TYPES[0] });
  pointsRef.current = [];
  setHazardPointCount(0);

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

  draggingDraftVertexIdxRef.current = null;
  suppressNextMapClickRef.current = false;
  dragPanWasEnabledRef.current = false;
  pointsRef.current = [];
  setHazardPointCount(0);
  setIsDrawingHazard(false);
  setHazardDraft(null);

  if (map) {
    const clear = () => {
      if (!map.isStyleLoaded()) return;
      ensureHazardDraftLayers(map);
      clearHazardDraft(map);
      setHazardDraftVisibility(map, false);
      try {
        if (!map.dragPan.isEnabled()) map.dragPan.enable();
        map.doubleClickZoom.enable();
      } catch {
        // ignore
      }
    };

    if (!map.isStyleLoaded()) map.once("idle", clear);
    else clear();
  }
};

  const undoHazardPoint = () => {
    if (!isDrawingHazard) return;

    const map = mapRef.current;
    if (!map) return;
    if (pointsRef.current.length === 0) return;

    suppressNextMapClickRef.current = false;
    pointsRef.current = pointsRef.current.slice(0, -1);
    setHazardPointCount(pointsRef.current.length);
    redrawDraftOpenPolygon(map);

    const draggingIdx = draggingDraftVertexIdxRef.current;
    if (draggingIdx === null) return;
    if (draggingIdx >= pointsRef.current.length) draggingDraftVertexIdxRef.current = null;
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
    draggingDraftVertexIdxRef.current = null;
    suppressNextMapClickRef.current = false;
    dragPanWasEnabledRef.current = false;
    pointsRef.current = [];
    setHazardPointCount(0);
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
    setLayersOpen(false);
    flyTo(pin.lng, pin.lat, 15);
  }, []);

  // ✅ Fully close details (no minimize tab)
  const cleanupDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelectedEmergencyId(null);
    setSelectedEmergencyTasks([]);
    setTasksLoading(false);
    setTasksError(null);
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

  useEffect(() => {
    if (!dispatchModalOpen) return;
    const availableIds = new Set(
      volunteers.filter((volunteer) => volunteer.status === "available").map((volunteer) => volunteer.id)
    );
    setDispatchSelection((prev) => prev.filter((id) => availableIds.has(id)));
  }, [dispatchModalOpen, volunteers]);

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

    try {
      const refreshedTasks = await fetchDispatchTasks({
        emergencyId: selectedEmergencyId,
      });
      setSelectedEmergencyTasks(Array.isArray(refreshedTasks) ? refreshedTasks : []);
      setTasksError(null);
    } catch {
      // Keep fallback assignment view if this refresh fails.
    }

    setAssignmentsByEmergency((prev) => {
      const existing = prev[selectedEmergencyId] ?? [];
      const merged = Array.from(new Set([...existing, ...chosen]));
      return { ...prev, [selectedEmergencyId]: merged };
    });

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

  const focusHazardZoneItem = useCallback(
    (id: string) => {
      const zone = (hazardZones ?? []).find((x: any) => String(x._id) === String(id));
      if (!zone) return;

      const points = getHazardGeometryPoints((zone as any).geometry);
      if (points.length === 0) {
        toastWarning("This hazard zone has no valid geometry to zoom to.");
        return;
      }

      const map = mapRef.current;
      if (!map || !mapReady) return;

      setShowHazardZones(true);

      const [firstPoint, ...restPoints] = points;
      const bounds = restPoints.reduce(
        (acc, point) => acc.extend(point),
        new mapboxgl.LngLatBounds(firstPoint, firstPoint)
      );

      map.fitBounds(bounds, {
        padding: { top: 96, right: 380, bottom: 96, left: 96 },
        maxZoom: 16,
        duration: 700,
        essential: true,
      });
    },
    [hazardZones, mapReady]
  );

  const deleteHazardZoneItem = async (id: string) => {
    const ok = await confirm({
      title: "Are you sure you want to delete?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      contentClassName: "bg-white dark:bg-[#0B1220]",
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

    selectedEmergency,
    selectedEmergencyDetails,
    selectedEmergencyTasks,
    tasksLoading,
    tasksError,
    detailsOpen,
    setDetailsOpen,
    cleanupDetails,
    zoomToSelectedEmergency,

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
    volunteersCount: showVolunteers ? availableVolunteersCount : 0,
    activeVolunteersCount,
    emergenciesCount: showEmergencies ? activeReports.length : 0,
    sosCount,
    liveIncidents,

    // hazard zones list + per-zone controls (dropdown)
    hazardZones,
    focusHazardZoneItem,
    toggleHazardZoneItem,
    deleteHazardZoneItem,

    hazardZonesLoading,
    hazardZonesError,
    refetchHazardZones,

    isDrawingHazard,
    hazardPointCount,
    startDrawHazard,
    cancelDrawHazard,
    undoHazardPoint,
    hazardDraft,
    draftForm,
    setDraftForm,
    saveHazardDraft,
  };
}

