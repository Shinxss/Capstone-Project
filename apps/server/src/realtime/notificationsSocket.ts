import type { Server as HttpServer } from "node:http";
import { Types } from "mongoose";
import { Server, type Socket } from "socket.io";
import { TokenBlocklist } from "../features/auth/TokenBlocklist.model";
import { DispatchOffer } from "../features/dispatches/dispatch.model";
import { EmergencyReport } from "../features/emergency/emergency.model";
import { getEmergencyRequestTrackingSnapshot } from "../features/emergency/services/emergencyReport.service";
import { User } from "../features/users/user.model";
import { verifyAccessToken } from "../utils/jwt";

type Role = "LGU" | "ADMIN" | "VOLUNTEER" | "COMMUNITY";
type VolunteerPresenceStatus = "ONLINE" | "BUSY";

type SocketUserContext = {
  userId: string;
  role: string;
  volunteerStatus?: string;
  onDuty?: boolean;
};

type AuthenticatedSocket = Socket & {
  data: SocketUserContext;
};

type VolunteerLocation = {
  lng: number;
  lat: number;
  at: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
};

type VolunteerPresenceRecord = {
  volunteerId: string;
  onDuty: boolean;
  status: VolunteerPresenceStatus;
  lastSeenAt: number;
  lastLocation?: VolunteerLocation;
  socketIds: Set<string>;
};

type VolunteerSubscription = {
  lng: number;
  lat: number;
  radiusKm: number;
};

type RequestSubscribeAck = (payload: { ok: boolean; message?: string }) => void;
type VolunteersSubscribeAck = (payload: { ok: boolean; message?: string }) => void;

const VOLUNTEERS_PUBLIC_ROOM = "volunteers:public";
const HEARTBEAT_TTL_MS = 60_000;
const HEARTBEAT_SWEEP_MS = 15_000;
const DEFAULT_RADIUS_KM = 5;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 20;

let io: Server | null = null;
let staleSweepTimer: NodeJS.Timeout | null = null;

const presenceByVolunteerId = new Map<string, VolunteerPresenceRecord>();
const socketIdToVolunteerId = new Map<string, string>();
const volunteerBusyById = new Map<string, boolean>();
const volunteerSubscriptions = new Map<string, VolunteerSubscription>();

function parseBearerToken(raw: string | undefined): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("Bearer ")) return value.slice("Bearer ".length).trim();
  return value;
}

function resolveAllowedOrigins() {
  return (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

function roleRoom(role: string) {
  return `role:${role}`;
}

function requestRoom(requestId: string) {
  return `request:${requestId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeRole(roleRaw: unknown) {
  return String(roleRaw ?? "").trim().toUpperCase();
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
  if (!record.lastLocation) return false;

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
  if (!io) return [];
  const room = io.sockets.adapter.rooms.get(VOLUNTEERS_PUBLIC_ROOM);
  if (!room || room.size === 0) return [];
  return Array.from(room);
}

function emitPresenceSnapshotToSocket(socket: Socket) {
  const subscription = volunteerSubscriptions.get(socket.id);
  const volunteers = Array.from(presenceByVolunteerId.values())
    .filter((record) => record.onDuty)
    .filter((record) => isInSubscriberRadius(subscription, record))
    .map((record) => toPublicPresence(record));

  socket.emit("volunteers:snapshot", {
    at: nowIso(),
    volunteers,
  });
}

function emitPresenceChanged(volunteerId: string, reason: string) {
  if (!io) return;

  const record = presenceByVolunteerId.get(volunteerId);
  const subscribers = getVolunteerSubscriberSocketIds();

  for (const socketId of subscribers) {
    const subscriber = io.sockets.sockets.get(socketId);
    if (!subscriber) continue;

    const subscription = volunteerSubscriptions.get(socketId);
    const inRange = record ? isInSubscriberRadius(subscription, record) : false;

    if (record && inRange) {
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
      volunteer: {
        volunteerId,
        status: "OFFLINE",
      },
    });
  }
}

function emitVolunteerLocation(volunteerId: string) {
  if (!io) return;

  const record = presenceByVolunteerId.get(volunteerId);
  if (!record || !record.lastLocation) return;

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
  }
) {
  const existing = presenceByVolunteerId.get(volunteerId);
  const next: VolunteerPresenceRecord = existing ?? {
    volunteerId,
    onDuty: Boolean(input.onDuty),
    status: volunteerBusyById.get(volunteerId) ? "BUSY" : "ONLINE",
    lastSeenAt: Date.now(),
    socketIds: new Set<string>(),
  };

  next.onDuty = Boolean(input.onDuty);
  next.status = volunteerBusyById.get(volunteerId) ? "BUSY" : "ONLINE";
  next.lastSeenAt = Date.now();

  if (input.socketId) {
    next.socketIds.add(input.socketId);
  }

  if (input.location) {
    next.lastLocation = input.location;
  }

  if (!next.onDuty) {
    presenceByVolunteerId.delete(volunteerId);
    emitPresenceChanged(volunteerId, "duty_off");
    return;
  }

  presenceByVolunteerId.set(volunteerId, next);
  emitPresenceChanged(volunteerId, "presence_updated");
}

function detachVolunteerSocket(socketId: string) {
  const volunteerId = socketIdToVolunteerId.get(socketId);
  if (!volunteerId) return;

  socketIdToVolunteerId.delete(socketId);
  const record = presenceByVolunteerId.get(volunteerId);
  if (!record) return;

  record.socketIds.delete(socketId);
  if (record.socketIds.size === 0) {
    presenceByVolunteerId.delete(volunteerId);
    emitPresenceChanged(volunteerId, "socket_disconnect");
  } else {
    record.lastSeenAt = Date.now();
    presenceByVolunteerId.set(volunteerId, record);
  }
}

function startPresenceSweep() {
  if (staleSweepTimer) return;

  staleSweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [volunteerId, record] of presenceByVolunteerId) {
      if (now - record.lastSeenAt <= HEARTBEAT_TTL_MS) continue;
      presenceByVolunteerId.delete(volunteerId);
      emitPresenceChanged(volunteerId, "stale_offline");
    }
  }, HEARTBEAT_SWEEP_MS);
}

async function authenticateSocket(socket: AuthenticatedSocket) {
  const authToken = parseBearerToken(socket.handshake.auth?.token as string | undefined);
  const headerToken = parseBearerToken(socket.handshake.headers.authorization as string | undefined);
  const token = authToken || headerToken;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = verifyAccessToken(token);
  const revoked = await TokenBlocklist.findOne({ jti: payload.jti }).select("_id").lean();
  if (revoked) {
    throw new Error("Unauthorized");
  }

  const user = await User.findById(payload.sub)
    .select("_id role volunteerStatus onDuty isActive")
    .lean();

  if (!user || user.isActive === false) {
    throw new Error("Unauthorized");
  }

  socket.data.userId = String(user._id);
  socket.data.role = normalizeRole(user.role);
  socket.data.volunteerStatus = String(user.volunteerStatus ?? "").toUpperCase();
  socket.data.onDuty = Boolean((user as { onDuty?: unknown }).onDuty ?? true);
}

function canBroadcastVolunteerPresence(socket: AuthenticatedSocket) {
  return (
    normalizeRole(socket.data.role) === "VOLUNTEER" &&
    String(socket.data.volunteerStatus ?? "").toUpperCase() === "APPROVED"
  );
}

async function resolveRequestSubscriptionPermission(input: {
  requestId: string;
  userId: string;
  role: string;
}) {
  const requestId = String(input.requestId || "").trim();
  const userId = String(input.userId || "").trim();
  const role = normalizeRole(input.role);

  if (!Types.ObjectId.isValid(requestId) || !Types.ObjectId.isValid(userId)) {
    return { allowed: false, reason: "Invalid request id" as const };
  }

  const report = await EmergencyReport.findById(requestId)
    .select("_id reportedBy")
    .lean();

  if (!report) {
    return { allowed: false, reason: "Request not found" as const };
  }

  if (role === "ADMIN" || role === "LGU") {
    return { allowed: true, reason: "role" as const };
  }

  if (report.reportedBy && String(report.reportedBy) === userId) {
    return { allowed: true, reason: "owner" as const };
  }

  if (role === "VOLUNTEER") {
    const assigned = await DispatchOffer.findOne({
      emergencyId: report._id,
      volunteerId: new Types.ObjectId(userId),
      status: { $in: ["PENDING", "ACCEPTED", "DONE", "VERIFIED"] },
    })
      .select("_id")
      .lean();

    if (assigned) {
      return { allowed: true, reason: "assigned" as const };
    }
  }

  return { allowed: false, reason: "Forbidden" as const };
}

async function emitTrackingSnapshotToSocket(socket: Socket, requestId: string) {
  const snapshot = await getEmergencyRequestTrackingSnapshot(requestId);
  if (!snapshot) return;

  socket.emit("request:tracking_snapshot", {
    requestId,
    at: nowIso(),
    data: snapshot,
  });
}

export function initNotificationsSocket(server: HttpServer) {
  if (io) return io;

  const allowedOrigins = resolveAllowedOrigins();

  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length === 0 ? true : allowedOrigins,
      credentials: true,
    },
  });

  startPresenceSweep();

  io.use(async (socket, next) => {
    try {
      await authenticateSocket(socket as AuthenticatedSocket);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    const role = normalizeRole(authedSocket.data.role);
    const userId = String(authedSocket.data.userId || "");

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(userRoom(userId));
    if (role) {
      socket.join(roleRoom(role));
    }

    if (canBroadcastVolunteerPresence(authedSocket) && authedSocket.data.onDuty) {
      socketIdToVolunteerId.set(socket.id, userId);
      upsertPresence(userId, {
        onDuty: true,
        socketId: socket.id,
      });
      void syncVolunteerBusyState(userId);
    }

    socket.on(
      "request:subscribe",
      async (
        payload: { requestId?: string | null } | undefined,
        ack?: RequestSubscribeAck
      ) => {
        const requestId = String(payload?.requestId ?? "").trim();
        if (!Types.ObjectId.isValid(requestId)) {
          if (typeof ack === "function") ack({ ok: false, message: "Invalid request id" });
          return;
        }

        const permission = await resolveRequestSubscriptionPermission({
          requestId,
          userId,
          role,
        });

        if (!permission.allowed) {
          if (typeof ack === "function") ack({ ok: false, message: permission.reason });
          return;
        }

        socket.join(requestRoom(requestId));
        await emitTrackingSnapshotToSocket(socket, requestId);

        if (typeof ack === "function") ack({ ok: true });
      }
    );

    socket.on("request:unsubscribe", (payload: { requestId?: string | null } | undefined) => {
      const requestId = String(payload?.requestId ?? "").trim();
      if (!requestId) return;
      socket.leave(requestRoom(requestId));
    });

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
        presenceByVolunteerId.delete(userId);
        emitPresenceChanged(userId, "heartbeat_off_duty");
        return;
      }

      upsertPresence(userId, {
        onDuty: true,
        socketId: socket.id,
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
  });

  return io;
}

export async function syncVolunteerBusyState(volunteerId: string) {
  const normalizedVolunteerId = String(volunteerId || "").trim();
  if (!Types.ObjectId.isValid(normalizedVolunteerId)) return;

  const hasActive = await DispatchOffer.exists({
    volunteerId: new Types.ObjectId(normalizedVolunteerId),
    status: { $in: ["PENDING", "ACCEPTED", "DONE"] },
  });

  const busy = Boolean(hasActive);
  volunteerBusyById.set(normalizedVolunteerId, busy);

  const record = presenceByVolunteerId.get(normalizedVolunteerId);
  if (!record) return;

  const nextStatus: VolunteerPresenceStatus = busy ? "BUSY" : "ONLINE";
  if (record.status === nextStatus) return;

  record.status = nextStatus;
  record.lastSeenAt = Date.now();
  presenceByVolunteerId.set(normalizedVolunteerId, record);
  emitPresenceChanged(normalizedVolunteerId, busy ? "dispatch_assigned" : "dispatch_cleared");
}

export async function emitRequestTrackingUpdate(requestId: string, reason = "tracking_updated") {
  if (!io) return;

  const normalizedRequestId = String(requestId || "").trim();
  if (!Types.ObjectId.isValid(normalizedRequestId)) return;

  const snapshot = await getEmergencyRequestTrackingSnapshot(normalizedRequestId);
  if (!snapshot) return;

  io.to(requestRoom(normalizedRequestId)).emit("request:tracking_update", {
    requestId: normalizedRequestId,
    reason,
    at: nowIso(),
    data: snapshot,
  });
}

export function emitNotificationsRefresh(reason: string, roles: Role[] = ["LGU", "ADMIN"]) {
  if (!io) return;
  const payload = {
    reason,
    at: nowIso(),
  };

  const uniqueRoles = Array.from(new Set(roles.map((role) => String(role).toUpperCase())));
  for (const role of uniqueRoles) {
    io.to(roleRoom(role)).emit("notifications:refresh", payload);
  }
}

export function emitUserNotification(
  userId: string,
  event: "notify:request_update" | "notify:dispatch_offer",
  payload: Record<string, unknown>
) {
  if (!io) return;

  const normalizedUserId = String(userId || "").trim();
  if (!Types.ObjectId.isValid(normalizedUserId)) return;

  io.to(userRoom(normalizedUserId)).emit(event, {
    ...payload,
    at: nowIso(),
  });
}
