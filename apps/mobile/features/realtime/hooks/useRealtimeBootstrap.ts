import { useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { showInAppNotification } from "../../notifications/components/InAppNotificationHost";
import {
  connectRealtime,
  disconnectRealtime,
  type LifelineSocket,
} from "../socketClient";

type RequestUpdatePayload = {
  requestId?: string;
  step?: string;
  title?: string;
  body?: string;
};

type DispatchOfferPayload = {
  dispatchId?: string;
  requestId?: string;
  title?: string;
  body?: string;
};

function normalizeRequestTarget(payload: RequestUpdatePayload) {
  const requestId = String(payload?.requestId ?? "").trim();
  if (!requestId) return undefined;
  return {
    pathname: "/my-request-tracking",
    params: { id: requestId },
  };
}

function normalizeDispatchTarget(_payload: DispatchOfferPayload) {
  return {
    pathname: "/(tabs)/tasks",
  };
}

export function useRealtimeBootstrap() {
  const { hydrated, mode, token, user } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (mode !== "authed" || !token) {
      disconnectRealtime();
      return;
    }

    const socket = connectRealtime(token);
    if (!socket) return;
    const normalizedRole = String(user?.role ?? "").trim().toUpperCase();
    const isVolunteer = normalizedRole === "VOLUNTEER";

    const onRequestUpdate = (payload: RequestUpdatePayload) => {
      showInAppNotification({
        title: String(payload?.title ?? "Request update"),
        body: String(payload?.body ?? "").trim(),
        target: normalizeRequestTarget(payload),
        tone: "info",
      });
    };

    const onDispatchOffer = (payload: DispatchOfferPayload) => {
      showInAppNotification({
        title: String(payload?.title ?? "New dispatch assignment"),
        body: String(payload?.body ?? "Open Tasks to respond."),
        target: normalizeDispatchTarget(payload),
        tone: "warning",
      });
    };

    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    if (isVolunteer) {
      const sendHeartbeat = () => {
        socket.emit("volunteer:heartbeat", { onDuty: true });
      };
      sendHeartbeat();
      heartbeatTimer = setInterval(sendHeartbeat, 15_000);
    }

    socket.on("notify:request_update", onRequestUpdate as Parameters<LifelineSocket["on"]>[1]);
    socket.on("notify:dispatch_offer", onDispatchOffer as Parameters<LifelineSocket["on"]>[1]);

    return () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      socket.off("notify:request_update", onRequestUpdate as Parameters<LifelineSocket["on"]>[1]);
      socket.off("notify:dispatch_offer", onDispatchOffer as Parameters<LifelineSocket["on"]>[1]);
    };
  }, [hydrated, mode, token, user?.role]);
}
