import { useCallback, useEffect, useMemo, useState } from "react";
import type { VolunteerApplication } from "../models/volunteerApplication.types";
import {
  getVolunteerApplicationById,
  listVolunteerApplications,
} from "../services/lguVolunteerApplications.service";
import { getLguToken } from "../../auth/services/authStorage";
import { DAGUPAN_CENTER } from "../../lguLiveMap/constants/lguLiveMap.constants";
import { createLivePresenceSocket } from "../../lguLiveMap/services/livePresence.socket";

export type VerifiedVolunteerPresenceStatus = "ONLINE" | "BUSY" | "IDLE" | "OFFLINE";
export type VerifiedVolunteerPresence = {
  status: VerifiedVolunteerPresenceStatus;
  lastSeenAt?: string;
};

function normalizePresenceStatus(raw: unknown): VerifiedVolunteerPresenceStatus | null {
  const status = String(raw ?? "").trim().toUpperCase();
  if (status === "ONLINE") return "ONLINE";
  if (status === "BUSY") return "BUSY";
  if (status === "IDLE") return "IDLE";
  if (status === "OFFLINE") return "OFFLINE";
  return null;
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const err = error as { message?: unknown; response?: { data?: { message?: unknown } } };
    const apiMessage = String(err.response?.data?.message ?? "").trim();
    if (apiMessage) return apiMessage;
    const baseMessage = String(err.message ?? "").trim();
    if (baseMessage) return baseMessage;
  }
  return fallback;
}

export function useLguVerifiedVolunteers() {
  // list state
  const [items, setItems] = useState<VolunteerApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [presenceReady, setPresenceReady] = useState(false);
  const [presenceByVolunteerId, setPresenceByVolunteerId] = useState<
    Record<string, VerifiedVolunteerPresence>
  >({});

  useEffect(() => {
    const token = getLguToken();
    if (!token) {
      setPresenceByVolunteerId({});
      setPresenceReady(false);
      return;
    }

    const socket = createLivePresenceSocket(token);

    const onSnapshot = (payload: {
      volunteers?: Array<{ volunteerId?: string; status?: string; lastSeenAt?: string }>;
    }) => {
      const next: Record<string, VerifiedVolunteerPresence> = {};
      for (const entry of payload?.volunteers ?? []) {
        const volunteerId = String(entry?.volunteerId ?? "").trim();
        const status = normalizePresenceStatus(entry?.status);
        if (!volunteerId || !status) continue;
        next[volunteerId] = {
          status,
          lastSeenAt: String(entry?.lastSeenAt ?? "").trim() || undefined,
        };
      }
      setPresenceByVolunteerId(next);
      setPresenceReady(true);
    };

    const onPresenceChanged = (payload: {
      volunteer?: { volunteerId?: string; status?: string; lastSeenAt?: string };
    }) => {
      const volunteerId = String(payload?.volunteer?.volunteerId ?? "").trim();
      const status = normalizePresenceStatus(payload?.volunteer?.status);
      if (!volunteerId || !status) return;

      setPresenceByVolunteerId((prev) => ({
        ...prev,
        [volunteerId]: {
          status,
          lastSeenAt:
            String(payload?.volunteer?.lastSeenAt ?? "").trim() || prev[volunteerId]?.lastSeenAt,
        },
      }));
      setPresenceReady(true);
    };

    const onLocationUpdate = (payload: {
      volunteer?: { volunteerId?: string; status?: string; location?: { at?: string } };
    }) => {
      const volunteerId = String(payload?.volunteer?.volunteerId ?? "").trim();
      const status = normalizePresenceStatus(payload?.volunteer?.status);
      if (!volunteerId || !status) return;

      setPresenceByVolunteerId((prev) => ({
        ...prev,
        [volunteerId]: {
          status,
          lastSeenAt: String(payload?.volunteer?.location?.at ?? "").trim() || prev[volunteerId]?.lastSeenAt,
        },
      }));
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

  const fetchList = useCallback(async () => {
    setLoading(true);
    setListError(null);

    try {
      const res = await listVolunteerApplications({
        q: query.trim() || undefined,
        status: ["verified"],
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (error: unknown) {
      setListError(errorMessage(error, "Failed to load verified volunteers"));
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const t = setTimeout(() => void fetchList(), 250);
    return () => clearTimeout(t);
  }, [fetchList]);

  // details modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const openDetails = useCallback(async (id: string) => {
    setOpen(true);
    setSelected(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const doc = await getVolunteerApplicationById(id);
      setSelected(doc);
    } catch (error: unknown) {
      setDetailsError(errorMessage(error, "Failed to load volunteer details"));
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setOpen(false);
    setSelected(null);
    setDetailsError(null);
  }, []);

  const counts = useMemo(() => {
    // for now: just total verified
    return { verified: total };
  }, [total]);

  return {
    items,
    total,
    loading,
    listError,
    query,
    setQuery,
    page,
    setPage,
    limit,
    refresh: fetchList,
    counts,
    presenceReady,
    presenceByVolunteerId,

    open,
    selected,
    detailsLoading,
    detailsError,
    openDetails,
    closeDetails,
  };
}
