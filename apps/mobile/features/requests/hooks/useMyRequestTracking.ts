import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { connectRealtime } from "../../realtime/socketClient";
import type { MyRequestTrackingDTO } from "../models/myRequests";
import { fetchMyRequestTracking } from "../services/myRequestsApi";
import { formatRelativeTime } from "../utils/formatters";

type Options = {
  pollMs?: number;
  enabled?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrackingDto(value: unknown): value is MyRequestTrackingDTO {
  if (!isRecord(value)) return false;
  return isRecord(value.request) && typeof value.request.id === "string" && isRecord(value.tracking) && isRecord(value.timeline);
}

function requestIdFromPayload(payload: unknown) {
  if (!isRecord(payload)) return "";
  if (typeof payload.requestId === "string") return payload.requestId.trim();
  if (!isRecord(payload.data) || !isRecord(payload.data.request)) return "";
  return typeof payload.data.request.id === "string" ? payload.data.request.id.trim() : "";
}

export function useMyRequestTracking(id: string | null | undefined, options?: Options) {
  const requestId = String(id ?? "").trim();
  const pollMs = options?.pollMs ?? 6000;
  const enabled = options?.enabled ?? true;
  const { mode, token } = useAuth();
  const [data, setData] = useState<MyRequestTrackingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySocketPayload = useCallback(
    (payload: unknown) => {
      const payloadRequestId = requestIdFromPayload(payload);
      if (payloadRequestId && requestId && payloadRequestId !== requestId) return;

      const next = isRecord(payload) && "data" in payload ? payload.data : payload;
      if (!isTrackingDto(next)) return;
      setData(next);
      setError(null);
      setLoading(false);
    },
    [requestId]
  );

  const refresh = useCallback(async () => {
    if (!enabled || !requestId) {
      setData(null);
      setError(null);
      return;
    }

    try {
      const next = await fetchMyRequestTracking(requestId);
      setData(next);
      setError(null);
    } catch (error) {
      console.warn("Failed to refresh request tracking", error);
      setError("Live tracking could not refresh.");
    }
  }, [enabled, requestId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await refresh();
      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !requestId || mode !== "authed" || !token) return;

    const socket = connectRealtime(token);
    if (!socket) return;

    const onSnapshot = (payload: unknown) => {
      applySocketPayload(payload);
    };

    const onUpdate = (payload: unknown) => {
      applySocketPayload(payload);
    };

    const subscribe = () => {
      socket.emit("request:subscribe", { requestId }, (ack) => {
        if (ack?.ok === false) {
          setError(String(ack.message ?? "Failed to subscribe to live tracking"));
        }
      });
    };

    socket.on("request:tracking_snapshot", onSnapshot);
    socket.on("request:tracking_update", onUpdate);

    if (socket.connected) {
      subscribe();
    } else {
      socket.on("connect", subscribe);
    }

    return () => {
      socket.emit("request:unsubscribe", { requestId });
      socket.off("request:tracking_snapshot", onSnapshot);
      socket.off("request:tracking_update", onUpdate);
      socket.off("connect", subscribe);
    };
  }, [applySocketPayload, enabled, mode, requestId, token]);

  useEffect(() => {
    if (!enabled || !requestId || pollMs <= 0) return;

    pollRef.current = setInterval(() => {
      void refresh();
    }, pollMs);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [enabled, pollMs, refresh, requestId]);

  useEffect(() => {
    if (!enabled || !requestId) return;
    tickerRef.current = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [enabled, requestId]);

  const lastUpdatedAgoText = useMemo(
    () => formatRelativeTime(data?.tracking?.lastUpdatedAt ?? null, nowMs),
    [data?.tracking?.lastUpdatedAt, nowMs]
  );

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdatedAgoText,
  };
}
