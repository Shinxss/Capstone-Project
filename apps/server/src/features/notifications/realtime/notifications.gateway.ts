import { Types } from "mongoose";
import type { Role } from "../../../realtime/socketAuth";
import { getRealtimeIO, nowIso, roleRoom, userRoom } from "../../../realtime/socketRuntime";

export function emitNotificationsRefresh(reason: string, roles: Role[] = ["LGU", "ADMIN"]) {
  const io = getRealtimeIO();
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
  const io = getRealtimeIO();
  if (!io) return;

  const normalizedUserId = String(userId || "").trim();
  if (!Types.ObjectId.isValid(normalizedUserId)) return;

  io.to(userRoom(normalizedUserId)).emit(event, {
    ...payload,
    at: nowIso(),
  });
}
