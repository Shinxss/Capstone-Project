import { Types } from "mongoose";
import type { Socket } from "socket.io";
import { DispatchOffer } from "../../dispatches/dispatch.model";
import { User } from "../../users/user.model";
import {
  canBroadcastVolunteerPresence,
  type AuthenticatedSocket,
} from "../../../realtime/socketAuth";
import { getRealtimeIO, nowIso } from "../../../realtime/socketRuntime";
import { emitRequestTrackingUpdate } from "../../emergency/realtime/requestTracking.gateway";

export type VolunteerPresenceStatus = "ONLINE" | "BUSY" | "IDLE" | "OFFLINE";

export type VolunteerLocation = {
  lng: number;
  lat: number;
  at: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
};

export type VolunteerPresenceRecord = {
  volunteerId: string;
  onDuty: boolean;
  status: VolunteerPresenceStatus;
  lastSeenAt: number;
  lastHeartbeatAt: number;
  lastInteractionAt: number;
  lastLocation?: VolunteerLocation;
  socketIds: Set<string>;
};

export type VolunteerSubscription = {
  lng: number;
  lat: number;
  radiusKm: number;
};

export type VolunteersSubscribeAck = (payload: { ok: boolean; message?: string }) => void;

export const VOLUNTEERS_PUBLIC_ROOM = "volunteers:public";
export const IDLE_AFTER_MS = 5 * 60_000;
export const OFFLINE_AFTER_MS = 15 * 60_000;
export const HEARTBEAT_SWEEP_MS = 15_000;
export const DEFAULT_RADIUS_KM = 5;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 20;

let staleSweepTimer: NodeJS.Timeout | null = null;

const presenceByVolunteerId = new Map<string, VolunteerPresenceRecord>();
const socketIdToVolunteerId = new Map<string, string>();
const volunteerBusyById = new Map<string, boolean>();
const volunteerSubscriptions = new Map<string, VolunteerSubscription>();

function resolveConnectedPresenceStatus(volunteerId: string): VolunteerPresenceStatus {
  return volunteerBusyById.get(volunteerId) ? "BUSY" : "ONLINE";
}

function resolvePresenceStatus(
  volunteerId: string,
  record: VolunteerPresenceRecord,
  now = Date.now()
): VolunteerPresenceStatus {
  if (!record.onDuty) return "OFFLINE";
  if (now - record.lastHeartbeatAt > OFFLINE_AFTER_MS) return "OFFLINE";
  if (record.socketIds.size <= 0) return resolveConnectedPresenceStatus(volunteerId);
  if (now - record.lastInteractionAt > IDLE_AFTER_MS) return "IDLE";
  return resolveConnectedPresenceStatus(volunteerId);
}

function toOfflinePresence(volunteerId: string, record?: VolunteerPresenceRecord) {
  return {
    volunteerId,
    status: "OFFLINE" as const,
    ...(record
      ? {
          lastSeenAt: new Date(record.lastSeenAt).toISOString(),
        }
      : {}),
  };
}

function sanitizeRadiusKm(input: unknown) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return DEFAULT_RADIUS_KM;
  return Math.max(MIN_RADIUS_KM, Math.min(MAX_RADIUS_KM, parsed));
}

function haversineKm(from: { lng: number; lat: number }, to: { lng: number; lat: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const earthRadiusKm = 6371;
  const latDelta = toRad(to.lat - from.lat);
  const lngDelta = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function isInSubscriberRadius(
  subscription: VolunteerSubscription | undefined,
  record: VolunteerPresenceRecord
) {
  if (!subscription) return true;
  // Keep presence visible even when latest GPS is missing; map layers can still
  // decide whether to render a marker based on coordinates.
  if (!record.lastLocation) return true;

  const km = haversineKm(
    {
      lng: subscription.lng,
      lat: subscription.lat,
    },
    {
      lng: record.lastLocation.lng,
      lat: record.lastLocation.lat,
    }
  );

  return km <= subscription.radiusKm;
}

function toPublicPresence(record: VolunteerPresenceRecord) {
  return {
    volunteerId: record.volunteerId,
    status: record.status,
    onDuty: record.onDuty,
    lastSeenAt: new Date(record.lastSeenAt).toISOString(),
    ...(record.lastLocation
      ? {
          lastLocation: {
            lng: record.lastLocation.lng,
            lat: record.lastLocation.lat,
            at: new Date(record.lastLocation.at).toISOString(),
            ...(Number.isFinite(record.lastLocation.accuracy)
              ? { accuracy: Number(record.lastLocation.accuracy) }
              : {}),
            ...(Number.isFinite(record.lastLocation.heading)
              ? { heading: Number(record.lastLocation.heading) }
              : {}),
            ...(Number.isFinite(record.lastLocation.speed)
              ? { speed: Number(record.lastLocation.speed) }
              : {}),
          },
        }
      : {}),
  };
}

function getVolunteerSubscriberSocketIds() {
  const io = getRealtimeIO();
  if (!io) return [];
  const room = io.sockets.adapter.rooms.get(VOLUNTEERS_PUBLIC_ROOM);
  if (!room || room.size === 0) return [];
  return Array.from(room);
}

function emitPresenceSnapshotToSocket(socket: Socket) {
  const subscription = volunteerSubscriptions.get(socket.id);
  const now = Date.now();
  const volunteers = Array.from(presenceByVolunteerId.values())
    .filter((record) => record.onDuty)
    .filter((record) => {
      record.status = resolvePresenceStatus(record.volunteerId, record, now);
      return record.status !== "OFFLINE";
    })
    .filter((record) => isInSubscriberRadius(subscription, record))
    .map((record) => toPublicPresence(record));

  socket.emit("volunteers:snapshot", {
    at: nowIso(),
    volunteers,
  });
}

function emitPresenceChanged(
  volunteerId: string,
  reason: string,
  fallbackRecord?: VolunteerPresenceRecord
) {
  const io = getRealtimeIO();
  if (!io) return;

  const record = presenceByVolunteerId.get(volunteerId) ?? fallbackRecord;
  if (record) {
    record.status = resolvePresenceStatus(volunteerId, record);
  }
  const subscribers = getVolunteerSubscriberSocketIds();

  for (const socketId of subscribers) {
    const subscriber = io.sockets.sockets.get(socketId);
    if (!subscriber) continue;

    const subscription = volunteerSubscriptions.get(socketId);
    const inRange = record ? isInSubscriberRadius(subscription, record) : false;

    if (record && inRange && record.status !== "OFFLINE") {
      subscriber.emit("volunteers:presence_changed", {
        at: nowIso(),
        reason,
        volunteer: toPublicPresence(record),
      });
      continue;
    }

    subscriber.emit("volunteers:presence_changed", {
      at: nowIso(),
      reason,
      volunteer: toOfflinePresence(volunteerId, record),
    });
  }
}

function emitVolunteerLocation(volunteerId: string) {
  const io = getRealtimeIO();
  if (!io) return;

  const record = presenceByVolunteerId.get(volunteerId);
  if (record) {
    record.status = resolvePresenceStatus(volunteerId, record);
  }
  if (!record || !record.lastLocation) return;
  if (record.status === "OFFLINE") return;

  const subscribers = getVolunteerSubscriberSocketIds();

  for (const socketId of subscribers) {
    const subscriber = io.sockets.sockets.get(socketId);
    if (!subscriber) continue;

    const subscription = volunteerSubscriptions.get(socketId);
    if (!isInSubscriberRadius(subscription, record)) continue;

    subscriber.emit("volunteers:location_update", {
      at: nowIso(),
      volunteer: {
        volunteerId: record.volunteerId,
        status: record.status,
        location: {
          lng: record.lastLocation.lng,
          lat: record.lastLocation.lat,
          at: new Date(record.lastLocation.at).toISOString(),
          ...(Number.isFinite(record.lastLocation.accuracy)
            ? { accuracy: Number(record.lastLocation.accuracy) }
            : {}),
          ...(Number.isFinite(record.lastLocation.heading)
            ? { heading: Number(record.lastLocation.heading) }
            : {}),
          ...(Number.isFinite(record.lastLocation.speed)
            ? { speed: Number(record.lastLocation.speed) }
            : {}),
        },
      },
    });
  }
}

function upsertPresence(
  volunteerId: string,
  input: {
    onDuty: boolean;
    socketId?: string;
    location?: VolunteerLocation;
    touchHeartbeat?: boolean;
    touchInteraction?: boolean;
    reason?: string;
  }
) {
  const now = Date.now();
  const existing = presenceByVolunteerId.get(volunteerId);
  const next: VolunteerPresenceRecord = existing ?? {
    volunteerId,
    onDuty: Boolean(input.onDuty),
    status: "OFFLINE",
    lastSeenAt: now,
    lastHeartbeatAt: now,
    lastInteractionAt: now,
    socketIds: new Set<string>(),
  };

  next.onDuty = Boolean(input.onDuty);
  next.lastHeartbeatAt = Number.isFinite(next.lastHeartbeatAt) ? next.lastHeartbeatAt : now;
  next.lastInteractionAt = Number.isFinite(next.lastInteractionAt) ? next.lastInteractionAt : now;
  next.lastSeenAt = Number.isFinite(next.lastSeenAt)
    ? Math.max(next.lastSeenAt, next.lastHeartbeatAt, next.lastInteractionAt)
    : Math.max(next.lastHeartbeatAt, next.lastInteractionAt);

  if (input.socketId) {
    next.socketIds.add(input.socketId);
  }

  if (input.location) {
    next.lastLocation = input.location;
  }

  if (input.touchHeartbeat) {
    next.lastHeartbeatAt = now;
    next.lastSeenAt = Math.max(next.lastSeenAt, now);
  }

  if (input.touchInteraction) {
    next.lastInteractionAt = now;
    next.lastSeenAt = Math.max(next.lastSeenAt, now);
  }

  next.status = resolvePresenceStatus(volunteerId, next, now);

  if (!next.onDuty) {
    presenceByVolunteerId.delete(volunteerId);
    emitPresenceChanged(volunteerId, input.reason ?? "duty_off", next);
    return;
  }

  presenceByVolunteerId.set(volunteerId, next);
  emitPresenceChanged(volunteerId, input.reason ?? "presence_updated");
}

function detachVolunteerSocket(socketId: string) {
  const volunteerId = socketIdToVolunteerId.get(socketId);
  if (!volunteerId) return;

  socketIdToVolunteerId.delete(socketId);
  const record = presenceByVolunteerId.get(volunteerId);
  if (!record) return;

  const now = Date.now();
  const prevStatus = record.status;
  record.socketIds.delete(socketId);
  record.lastSeenAt = Math.max(record.lastSeenAt, now);

  record.status = resolvePresenceStatus(volunteerId, record, now);
  presenceByVolunteerId.set(volunteerId, record);

  if (record.status !== prevStatus) {
    emitPresenceChanged(volunteerId, "socket_status_changed");
  }
}

function startPresenceSweep() {
  if (staleSweepTimer) return;

  staleSweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [volunteerId, record] of presenceByVolunteerId) {
      const previousStatus = record.status;
      const nextStatus = resolvePresenceStatus(volunteerId, record, now);
      if (previousStatus === nextStatus) continue;

      record.status = nextStatus;
      if (nextStatus === "OFFLINE") {
        for (const socketId of record.socketIds) {
          socketIdToVolunteerId.delete(socketId);
        }
        record.socketIds.clear();
      }
      presenceByVolunteerId.set(volunteerId, record);

      if (nextStatus === "OFFLINE") {
        emitPresenceChanged(volunteerId, "heartbeat_timeout");
        continue;
      }

      if (nextStatus === "IDLE") {
        emitPresenceChanged(volunteerId, "interaction_idle");
        continue;
      }

      emitPresenceChanged(volunteerId, "presence_resumed");
    }
  }, HEARTBEAT_SWEEP_MS);
}

export function registerVolunteerPresenceSocketHandlers(
  socket: Socket,
  authedSocket: AuthenticatedSocket
) {
  startPresenceSweep();

  const userId = String(authedSocket.data.userId || "");

  if (canBroadcastVolunteerPresence(authedSocket) && authedSocket.data.onDuty) {
    socketIdToVolunteerId.set(socket.id, userId);
    upsertPresence(userId, {
      onDuty: true,
      socketId: socket.id,
      touchHeartbeat: true,
      touchInteraction: true,
      reason: "socket_connected",
    });
    void syncVolunteerBusyState(userId);
  }

  socket.on(
    "volunteers:subscribe",
    (
      payload: { lng?: number; lat?: number; radiusKm?: number } | undefined,
      ack?: VolunteersSubscribeAck
    ) => {
      const lng = Number(payload?.lng);
      const lat = Number(payload?.lat);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        if (typeof ack === "function") ack({ ok: false, message: "lng and lat are required" });
        return;
      }

      volunteerSubscriptions.set(socket.id, {
        lng,
        lat,
        radiusKm: sanitizeRadiusKm(payload?.radiusKm),
      });
      socket.join(VOLUNTEERS_PUBLIC_ROOM);
      emitPresenceSnapshotToSocket(socket);

      if (typeof ack === "function") ack({ ok: true });
    }
  );

  socket.on("volunteers:unsubscribe", () => {
    volunteerSubscriptions.delete(socket.id);
    socket.leave(VOLUNTEERS_PUBLIC_ROOM);
  });

  socket.on("volunteer:heartbeat", async (payload: { onDuty?: boolean } | undefined) => {
    if (!canBroadcastVolunteerPresence(authedSocket)) return;

    const onDutyInput =
      typeof payload?.onDuty === "boolean"
        ? payload.onDuty
        : Boolean(authedSocket.data.onDuty ?? true);

    authedSocket.data.onDuty = onDutyInput;
    socketIdToVolunteerId.set(socket.id, userId);

    await User.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { onDuty: onDutyInput } }
    ).catch(() => undefined);

    if (!onDutyInput) {
      const existing = presenceByVolunteerId.get(userId);
      if (existing) {
        existing.onDuty = false;
      }
      presenceByVolunteerId.delete(userId);
      emitPresenceChanged(userId, "heartbeat_off_duty", existing);
      return;
    }

    upsertPresence(userId, {
      onDuty: true,
      socketId: socket.id,
      touchHeartbeat: true,
      reason: "heartbeat",
    });
    await syncVolunteerBusyState(userId);
  });

  socket.on(
    "volunteer:location_update",
    (payload: {
      lng?: number;
      lat?: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    }) => {
      if (!canBroadcastVolunteerPresence(authedSocket)) return;
      if (!authedSocket.data.onDuty) return;

      const lng = Number(payload?.lng);
      const lat = Number(payload?.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      socketIdToVolunteerId.set(socket.id, userId);
      upsertPresence(userId, {
        onDuty: true,
        socketId: socket.id,
        location: {
          lng,
          lat,
          at: Date.now(),
          ...(Number.isFinite(payload?.accuracy) ? { accuracy: Number(payload.accuracy) } : {}),
          ...(Number.isFinite(payload?.heading) ? { heading: Number(payload.heading) } : {}),
          ...(Number.isFinite(payload?.speed) ? { speed: Number(payload.speed) } : {}),
        },
        touchHeartbeat: true,
        touchInteraction: true,
        reason: "location_update",
      });

      emitVolunteerLocation(userId);

      void (async () => {
        if (!Types.ObjectId.isValid(userId)) return;

        const updatedDispatch = await DispatchOffer.findOneAndUpdate(
          {
            volunteerId: new Types.ObjectId(userId),
            status: { $in: ["ACCEPTED", "DONE", "VERIFIED"] },
          },
          {
            $set: {
              lastKnownLocation: {
                type: "Point",
                coordinates: [lng, lat],
                ...(Number.isFinite(payload?.accuracy) ? { accuracy: Number(payload.accuracy) } : {}),
                ...(Number.isFinite(payload?.heading) ? { heading: Number(payload.heading) } : {}),
                ...(Number.isFinite(payload?.speed) ? { speed: Number(payload.speed) } : {}),
              },
              lastKnownLocationAt: new Date(),
            },
          },
          {
            sort: { updatedAt: -1 },
            new: true,
          }
        )
          .select("emergencyId")
          .lean();

        if (!updatedDispatch?.emergencyId) return;
        await emitRequestTrackingUpdate(String(updatedDispatch.emergencyId), "responder_location");
      })();
    }
  );

  socket.on("disconnect", () => {
    volunteerSubscriptions.delete(socket.id);
    detachVolunteerSocket(socket.id);
  });
}

export async function syncVolunteerBusyState(volunteerId: string) {
  const normalizedVolunteerId = String(volunteerId || "").trim();
  if (!Types.ObjectId.isValid(normalizedVolunteerId)) return;

  const hasActive = await DispatchOffer.exists({
    volunteerId: new Types.ObjectId(normalizedVolunteerId),
    status: "ACCEPTED",
  });

  const busy = Boolean(hasActive);
  volunteerBusyById.set(normalizedVolunteerId, busy);

  const record = presenceByVolunteerId.get(normalizedVolunteerId);
  if (!record) return;

  const nextStatus: VolunteerPresenceStatus = resolvePresenceStatus(normalizedVolunteerId, record);
  if (record.status === nextStatus) return;

  record.status = nextStatus;
  presenceByVolunteerId.set(normalizedVolunteerId, record);

  if (nextStatus === "OFFLINE") {
    emitPresenceChanged(normalizedVolunteerId, "heartbeat_timeout");
    return;
  }

  if (nextStatus === "IDLE") {
    emitPresenceChanged(normalizedVolunteerId, "interaction_idle");
    return;
  }

  emitPresenceChanged(normalizedVolunteerId, busy ? "dispatch_assigned" : "dispatch_cleared");
}

export function getVolunteerPresenceStatus(volunteerId: string): VolunteerPresenceStatus {
  const normalizedVolunteerId = String(volunteerId || "").trim();
  if (!normalizedVolunteerId) return "OFFLINE";

  const record = presenceByVolunteerId.get(normalizedVolunteerId);
  if (!record || !record.onDuty) return "OFFLINE";

  const nextStatus = resolvePresenceStatus(normalizedVolunteerId, record);
  record.status = nextStatus;
  presenceByVolunteerId.set(normalizedVolunteerId, record);
  return nextStatus;
}
