import { Types } from "mongoose";
import type { Socket } from "socket.io";
import { DispatchOffer } from "../../dispatches/dispatch.model";
import { getEmergencyRequestTrackingSnapshot } from "../services/emergencyReport.service";
import { EmergencyReport } from "../emergency.model";
import { normalizeRole, nowIso, requestRoom, getRealtimeIO } from "../../../realtime/socketRuntime";

export type RequestSubscribeAck = (payload: { ok: boolean; message?: string }) => void;

export async function resolveRequestSubscriptionPermission(input: {
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

export async function emitTrackingSnapshotToSocket(socket: Socket, requestId: string) {
  const snapshot = await getEmergencyRequestTrackingSnapshot(requestId);
  if (!snapshot) return;

  socket.emit("request:tracking_snapshot", {
    requestId,
    at: nowIso(),
    data: snapshot,
  });
}

export async function emitRequestTrackingUpdate(requestId: string, reason = "tracking_updated") {
  const io = getRealtimeIO();
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

export function registerRequestTrackingSocketHandlers(
  socket: Socket,
  context: { userId: string; role: string }
) {
  const userId = String(context.userId || "").trim();
  const role = String(context.role || "").trim();

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
}
