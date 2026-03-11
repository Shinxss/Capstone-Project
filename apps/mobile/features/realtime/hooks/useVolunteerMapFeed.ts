import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { connectRealtime } from "../socketClient";

export type VolunteerMapPresence = {
  volunteerId: string;
  status: "ONLINE" | "BUSY" | "IDLE";
  onDuty: boolean;
  lastSeenAt?: string;
  location?: {
    lng: number;
    lat: number;
    at: string;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
};

type Options = {
  lng?: number;
  lat?: number;
  radiusKm?: number;
  enabled?: boolean;
};

type SnapshotPayload = {
  volunteers?: Array<{
    volunteerId?: string;
    status?: string;
    onDuty?: boolean;
    lastSeenAt?: string;
    lastLocation?: {
      lng?: number;
      lat?: number;
      at?: string;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
  }>;
};

type PresenceChangedPayload = {
  volunteer?: {
    volunteerId?: string;
    status?: string;
    onDuty?: boolean;
    lastSeenAt?: string;
    lastLocation?: {
      lng?: number;
      lat?: number;
      at?: string;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
  };
};

type LocationUpdatePayload = {
  volunteer?: {
    volunteerId?: string;
    status?: string;
    location?: {
      lng?: number;
      lat?: number;
      at?: string;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
  };
};

function normalizeStatus(raw: unknown): VolunteerMapPresence["status"] | null {
  const status = String(raw ?? "").trim().toUpperCase();
  if (status === "ONLINE") return "ONLINE";
  if (status === "BUSY") return "BUSY";
  if (status === "IDLE") return "IDLE";
  return null;
}

function normalizePresence(payload: {
  volunteerId?: string;
  status?: string;
  onDuty?: boolean;
  lastSeenAt?: string;
  lastLocation?: {
    lng?: number;
    lat?: number;
    at?: string;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
}): VolunteerMapPresence | null {
  const volunteerId = String(payload?.volunteerId ?? "").trim();
  const status = normalizeStatus(payload?.status);
  if (!volunteerId || !status) return null;

  const lng = Number(payload?.lastLocation?.lng);
  const lat = Number(payload?.lastLocation?.lat);
  const hasLocation = Number.isFinite(lng) && Number.isFinite(lat);

  return {
    volunteerId,
    status,
    onDuty: Boolean(payload?.onDuty ?? true),
    lastSeenAt: payload?.lastSeenAt,
    ...(hasLocation
      ? {
          location: {
            lng,
            lat,
            at: String(payload?.lastLocation?.at ?? new Date().toISOString()),
            ...(Number.isFinite(payload?.lastLocation?.accuracy)
              ? { accuracy: Number(payload.lastLocation?.accuracy) }
              : {}),
            ...(Number.isFinite(payload?.lastLocation?.heading)
              ? { heading: Number(payload.lastLocation?.heading) }
              : {}),
            ...(Number.isFinite(payload?.lastLocation?.speed)
              ? { speed: Number(payload.lastLocation?.speed) }
              : {}),
          },
        }
      : {}),
  };
}

export function useVolunteerMapFeed(options: Options) {
  const { mode, token } = useAuth();
  const enabled = options.enabled ?? true;
  const lng = Number(options.lng);
  const lat = Number(options.lat);
  const radiusKm = options.radiusKm ?? 5;
  const [records, setRecords] = useState<Record<string, VolunteerMapPresence>>({});

  useEffect(() => {
    if (!enabled || mode !== "authed" || !token) {
      setRecords({});
      return;
    }
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const socket = connectRealtime(token);
    if (!socket) return;

    const onSnapshot = (payload: SnapshotPayload) => {
      const next: Record<string, VolunteerMapPresence> = {};
      for (const volunteer of payload?.volunteers ?? []) {
        const normalized = normalizePresence(volunteer);
        if (!normalized) continue;
        next[normalized.volunteerId] = normalized;
      }
      setRecords(next);
    };

    const onPresenceChanged = (payload: PresenceChangedPayload) => {
      const volunteerId = String(payload?.volunteer?.volunteerId ?? "").trim();
      const status = String(payload?.volunteer?.status ?? "").trim().toUpperCase();
      if (!volunteerId) return;

      if (status === "OFFLINE") {
        setRecords((prev) => {
          const next = { ...prev };
          delete next[volunteerId];
          return next;
        });
        return;
      }

      const normalized = normalizePresence(payload.volunteer ?? {});
      if (!normalized) return;
      setRecords((prev) => ({ ...prev, [volunteerId]: normalized }));
    };

    const onLocationUpdate = (payload: LocationUpdatePayload) => {
      const volunteerId = String(payload?.volunteer?.volunteerId ?? "").trim();
      if (!volunteerId) return;

      const lngValue = Number(payload?.volunteer?.location?.lng);
      const latValue = Number(payload?.volunteer?.location?.lat);
      if (!Number.isFinite(lngValue) || !Number.isFinite(latValue)) return;

      setRecords((prev) => {
        const existing = prev[volunteerId];
        if (!existing) return prev;

        return {
          ...prev,
          [volunteerId]: {
            ...existing,
            status: normalizeStatus(payload?.volunteer?.status) ?? existing.status,
            location: {
              lng: lngValue,
              lat: latValue,
              at: String(payload?.volunteer?.location?.at ?? new Date().toISOString()),
              ...(Number.isFinite(payload?.volunteer?.location?.accuracy)
                ? { accuracy: Number(payload.volunteer?.location?.accuracy) }
                : {}),
              ...(Number.isFinite(payload?.volunteer?.location?.heading)
                ? { heading: Number(payload.volunteer?.location?.heading) }
                : {}),
              ...(Number.isFinite(payload?.volunteer?.location?.speed)
                ? { speed: Number(payload.volunteer?.location?.speed) }
                : {}),
            },
          },
        };
      });
    };

    const subscribe = () => {
      socket.emit("volunteers:subscribe", { lng, lat, radiusKm }, () => undefined);
    };

    socket.on("volunteers:snapshot", onSnapshot);
    socket.on("volunteers:presence_changed", onPresenceChanged);
    socket.on("volunteers:location_update", onLocationUpdate);

    if (socket.connected) {
      subscribe();
    } else {
      socket.on("connect", subscribe);
    }

    return () => {
      socket.emit("volunteers:unsubscribe");
      socket.off("volunteers:snapshot", onSnapshot);
      socket.off("volunteers:presence_changed", onPresenceChanged);
      socket.off("volunteers:location_update", onLocationUpdate);
      socket.off("connect", subscribe);
    };
  }, [enabled, lat, lng, mode, radiusKm, token]);

  const volunteers = useMemo(
    () =>
      Object.values(records).filter(
        (entry) => entry.status === "ONLINE" || entry.status === "BUSY" || entry.status === "IDLE"
      ),
    [records]
  );

  return {
    volunteers,
  };
}
