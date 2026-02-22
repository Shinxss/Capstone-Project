import { io, type Socket } from "socket.io-client";

type NotificationsRefreshPayload = {
  reason: string;
  at: string;
};

const apiBaseUrl = String(import.meta.env.VITE_API_URL || "http://localhost:5000").trim();
const socketBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export function createNotificationsSocket(token: string): Socket {
  return io(socketBaseUrl, {
    autoConnect: false,
    withCredentials: true,
    auth: {
      token: token ? `Bearer ${token}` : "",
    },
  });
}

export type { NotificationsRefreshPayload };
