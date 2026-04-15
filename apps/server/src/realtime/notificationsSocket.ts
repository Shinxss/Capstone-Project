import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerRequestTrackingSocketHandlers } from "../features/emergency/realtime/requestTracking.gateway";
import { registerVolunteerPresenceSocketHandlers } from "../features/volunteers/realtime/volunteerPresence.gateway";
import { authenticateSocket, type AuthenticatedSocket } from "./socketAuth";
import {
  getRealtimeIO,
  normalizeRole,
  resolveAllowedOrigins,
  roleRoom,
  setRealtimeIO,
  userRoom,
} from "./socketRuntime";

export function initNotificationsSocket(server: HttpServer) {
  const existing = getRealtimeIO();
  if (existing) return existing;

  const allowedOrigins = resolveAllowedOrigins();

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length === 0 ? true : allowedOrigins,
      credentials: true,
    },
  });

  setRealtimeIO(io);

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

    registerRequestTrackingSocketHandlers(socket, { userId, role });
    registerVolunteerPresenceSocketHandlers(socket, authedSocket);
  });

  return io;
}

export { emitNotificationsRefresh, emitUserNotification } from "../features/notifications/realtime/notifications.gateway";
export {
  syncVolunteerBusyState,
  getVolunteerPresenceStatus,
} from "../features/volunteers/realtime/volunteerPresence.gateway";
export {
  syncVolunteerBusyState as syncDispatchAssigneeBusyState,
  getVolunteerPresenceStatus as getDispatchAssigneePresenceStatus,
} from "../features/volunteers/realtime/volunteerPresence.gateway";
export { emitRequestTrackingUpdate } from "../features/emergency/realtime/requestTracking.gateway";
