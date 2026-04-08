import { useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { showInAppNotification } from "../../notifications/components/InAppNotificationHost";
import { addMobileNotification } from "../../notifications/services/mobileNotificationsStore";
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

function normalizeStep(raw: unknown) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ");
}

function requestFeedCopy(payload: RequestUpdatePayload) {
  const step = normalizeStep(payload.step);

  if (step === "APPROVED" || step === "VERIFIED") {
    return {
      idPrefix: "emergency-verified",
      type: "EMERGENCY_VERIFIED" as const,
      title: "Emergency verified",
      body: "LGU has verified your reported emergency and response is being coordinated.",
    };
  }

  if (step === "ASSIGNED") {
    return {
      idPrefix: "request-dispatched",
      type: "RESPONDER_DISPATCHED" as const,
      title: "Responder dispatched by LGU",
      body: "LGU dispatched a responder for your request.",
    };
  }

  if (step === "EN ROUTE") {
    return {
      idPrefix: "request-enroute",
      type: "RESPONDER_EN_ROUTE" as const,
      title: "Responder en route",
      body: "Your responder is on the way to your location.",
    };
  }

  if (step === "ARRIVED") {
    return {
      idPrefix: "request-arrived",
      type: "RESPONDER_ARRIVED" as const,
      title: "Responder arrived",
      body: "A responder has arrived at your location.",
    };
  }

  if (step === "RESOLVED") {
    return {
      idPrefix: "request-resolved",
      type: "EMERGENCY_RESOLVED" as const,
      title: "Emergency resolved",
      body: "Your emergency request was marked as resolved.",
    };
  }

  if (step === "VERIFICATION" || step === "SUBMITTED" || !step) {
    return {
      idPrefix: "request-ack",
      type: "HELP_REQUEST_ACKNOWLEDGED" as const,
      title: "Request acknowledged",
      body:
        step === "VERIFICATION"
          ? "Your emergency report is under verification."
          : "LGU has received your help request.",
    };
  }

  return {
    idPrefix: "request-update",
    type: "SYSTEM" as const,
    title: String(payload?.title ?? "Request update").trim() || "Request update",
    body: String(payload?.body ?? "").trim() || "There is an update to your emergency request.",
  };
}

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

      const copy = requestFeedCopy(payload);
      const requestId = String(payload?.requestId ?? "").trim();
      const fallbackId = Date.now().toString();
      const dedupeId = `${copy.idPrefix}:${requestId || fallbackId}`;

      void addMobileNotification({
        id: dedupeId,
        type: copy.type,
        title: copy.title,
        body: copy.body,
        createdAt: new Date().toISOString(),
        routeName: "/my-request-tracking",
        routeParams: requestId ? { id: requestId } : undefined,
        relatedEntityType: "REQUEST",
        relatedEntityId: requestId || undefined,
        metadata: {
          requestId,
          step: normalizeStep(payload?.step),
        },
      });
    };

    const onDispatchOffer = (payload: DispatchOfferPayload) => {
      showInAppNotification({
        title: String(payload?.title ?? "New dispatch assignment"),
        body: String(payload?.body ?? "Open Tasks to respond."),
        target: normalizeDispatchTarget(payload),
        tone: "warning",
      });

      const dispatchId = String(payload?.dispatchId ?? "").trim();
      const requestId = String(payload?.requestId ?? "").trim();
      const dedupeId = `dispatch-offer:${dispatchId || requestId || Date.now()}`;

      void addMobileNotification({
        id: dedupeId,
        type: "NEW_TASK_ASSIGNED",
        title: "New dispatch assignment",
        body: "LGU assigned you to a new emergency. Open Tasks to respond.",
        createdAt: new Date().toISOString(),
        routeName: "/(tabs)/tasks",
        relatedEntityType: "TASK",
        relatedEntityId: dispatchId || requestId || undefined,
        metadata: {
          dispatchId,
          requestId,
        },
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
