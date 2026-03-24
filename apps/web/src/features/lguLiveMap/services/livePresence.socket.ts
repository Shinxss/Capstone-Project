import { io, type Socket } from "socket.io-client";

type SubscribeAck = { ok: boolean; message?: string };

type VolunteersSnapshotPayload = {
  at?: string;
  volunteers?: Array<{
    volunteerId?: string;
    status?: "ONLINE" | "BUSY" | "IDLE";
    onDuty?: boolean;
    lastSeenAt?: string;
    lastLocation?: {
      lng?: number;
      lat?: number;
      at?: string;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
  }>;
};

type VolunteersPresenceChangedPayload = {
  at?: string;
  reason?: string;
  volunteer?: {
    volunteerId?: string;
    status?: "ONLINE" | "BUSY" | "IDLE" | "OFFLINE";
    onDuty?: boolean;
    lastSeenAt?: string;
    lastLocation?: {
      lng?: number;
      lat?: number;
      at?: string;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
  };
};

type VolunteersLocationUpdatePayload = {
  at?: string;
  volunteer?: {
    volunteerId?: string;
    status?: "ONLINE" | "BUSY" | "IDLE";
    location?: {
      lng?: number;
      lat?: number;
      at?: string;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
  };
};

export type LivePresenceSocket = Socket<
  {
    "volunteers:snapshot": (payload: VolunteersSnapshotPayload) => void;
    "volunteers:presence_changed": (payload: VolunteersPresenceChangedPayload) => void;
    "volunteers:location_update": (payload: VolunteersLocationUpdatePayload) => void;
  },
  {
    "volunteers:subscribe": (
      payload: { lng: number; lat: number; radiusKm?: number },
      ack?: (result: SubscribeAck) => void
    ) => void;
    "volunteers:unsubscribe": () => void;
  }
>;

const apiBaseUrl = String(import.meta.env.VITE_API_URL || "http://localhost:5000").trim();
const socketBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export function createLivePresenceSocket(token?: string): LivePresenceSocket {
  return io(socketBaseUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket"],
    ...(token ? { auth: { token: `Bearer ${token}` } } : {}),
  }) as LivePresenceSocket;
}
