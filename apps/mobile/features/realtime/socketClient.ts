import { io, type Socket } from "socket.io-client";

type ServerToClientEvents = {
  "request:tracking_snapshot": (payload: any) => void;
  "request:tracking_update": (payload: any) => void;
  "volunteers:snapshot": (payload: any) => void;
  "volunteers:presence_changed": (payload: any) => void;
  "volunteers:location_update": (payload: any) => void;
  "notify:request_update": (payload: any) => void;
  "notify:dispatch_offer": (payload: any) => void;
};

type ClientToServerEvents = {
  "request:subscribe": (payload: { requestId: string }, ack?: (result: { ok: boolean; message?: string }) => void) => void;
  "request:unsubscribe": (payload: { requestId: string }) => void;
  "volunteers:subscribe": (
    payload: { lng: number; lat: number; radiusKm?: number },
    ack?: (result: { ok: boolean; message?: string }) => void
  ) => void;
  "volunteers:unsubscribe": () => void;
  "volunteer:heartbeat": (payload: { onDuty?: boolean }) => void;
  "volunteer:location_update": (payload: {
    lng: number;
    lat: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  }) => void;
};

export type LifelineSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function resolveSocketBaseUrl() {
  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL || "").trim();
  if (!apiUrl) return "";
  return apiUrl.replace(/\/api\/?$/, "");
}

let socket: LifelineSocket | null = null;
let socketToken = "";

function createSocket(token: string) {
  const baseUrl = resolveSocketBaseUrl();
  if (!baseUrl) return null;

  return io(baseUrl, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    auth: {
      token: token ? `Bearer ${token}` : "",
    },
  }) as LifelineSocket;
}

export function connectRealtime(token: string) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return null;

  if (!socket || socketToken !== normalizedToken) {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    socket = createSocket(normalizedToken);
    socketToken = normalizedToken;
  }

  if (!socket) return null;
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function getRealtimeSocket() {
  return socket;
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  socketToken = "";
}
