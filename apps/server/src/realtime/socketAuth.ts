import type { Socket } from "socket.io";
import { TokenBlocklist } from "../features/auth/TokenBlocklist.model";
import { readAccessTokenFromCookieHeader } from "../features/auth/authCookie";
import { User } from "../features/users/user.model";
import { verifyAccessToken } from "../utils/jwt";
import { normalizeRole } from "./socketRuntime";

export type Role = "LGU" | "ADMIN" | "VOLUNTEER" | "RESPONDER" | "COMMUNITY";

export type SocketUserContext = {
  userId: string;
  role: string;
  volunteerStatus?: string;
  onDuty?: boolean;
};

export type AuthenticatedSocket = Socket & {
  data: SocketUserContext;
};

export function parseBearerToken(raw: string | undefined): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("Bearer ")) return value.slice("Bearer ".length).trim();
  return value;
}

export async function authenticateSocket(socket: AuthenticatedSocket) {
  const authToken = parseBearerToken(socket.handshake.auth?.token as string | undefined);
  const headerToken = parseBearerToken(socket.handshake.headers.authorization as string | undefined);
  const cookieToken = readAccessTokenFromCookieHeader(socket.handshake.headers.cookie as string | undefined);
  const token = authToken || headerToken || cookieToken;

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

export function canBroadcastVolunteerPresence(socket: AuthenticatedSocket) {
  const normalizedRole = normalizeRole(socket.data.role);
  if (normalizedRole === "RESPONDER") {
    return true;
  }

  return (
    normalizedRole === "VOLUNTEER" &&
    String(socket.data.volunteerStatus ?? "").toUpperCase() === "APPROVED"
  );
}
