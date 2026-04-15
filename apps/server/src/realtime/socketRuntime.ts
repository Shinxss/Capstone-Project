import type { Server } from "socket.io";

let io: Server | null = null;

export function setRealtimeIO(nextIO: Server) {
  io = nextIO;
}

export function getRealtimeIO() {
  return io;
}

export function userRoom(userId: string) {
  return `user:${userId}`;
}

export function roleRoom(role: string) {
  return `role:${role}`;
}

export function requestRoom(requestId: string) {
  return `request:${requestId}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeRole(roleRaw: unknown) {
  return String(roleRaw ?? "").trim().toUpperCase();
}

export function resolveAllowedOrigins() {
  return (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
