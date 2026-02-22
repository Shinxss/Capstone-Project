import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { TokenBlocklist } from "../features/auth/TokenBlocklist.model";
import { verifyAccessToken } from "../utils/jwt";

type Role = "LGU" | "ADMIN" | "VOLUNTEER";

type AuthenticatedSocket = Socket & {
  data: {
    userId?: string;
    role?: string;
  };
};

let io: Server | null = null;

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

  socket.data.userId = payload.sub;
  socket.data.role = String(payload.role || "").toUpperCase();
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

  io.use(async (socket, next) => {
    try {
      await authenticateSocket(socket as AuthenticatedSocket);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const role = String((socket as AuthenticatedSocket).data.role || "").toUpperCase();
    if (role) {
      socket.join(`role:${role}`);
    }
  });

  return io;
}

export function emitNotificationsRefresh(reason: string, roles: Role[] = ["LGU", "ADMIN"]) {
  if (!io) return;
  const payload = {
    reason,
    at: new Date().toISOString(),
  };

  const uniqueRoles = Array.from(new Set(roles.map((role) => String(role).toUpperCase())));
  for (const role of uniqueRoles) {
    io.to(`role:${role}`).emit("notifications:refresh", payload);
  }
}
