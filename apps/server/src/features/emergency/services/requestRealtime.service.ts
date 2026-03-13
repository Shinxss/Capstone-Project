import { Types } from "mongoose";
import { sendRequestStatusPush } from "../../notifications/pushNotification.service";
import { EmergencyReport } from "../emergency.model";
import {
  getEmergencyRequestTrackingSnapshot,
  type TrackingLabel,
} from "./emergencyReport.service";
import {
  emitRequestTrackingUpdate,
  emitUserNotification,
} from "../../../realtime/notificationsSocket";

function trackingStepFromLabel(label: TrackingLabel) {
  if (label === "Submitted") return "Submitted";
  if (label === "Assigned") return "Assigned";
  if (label === "En Route") return "En Route";
  if (label === "Arrived") return "Arrived";
  if (label === "Resolved") return "Resolved";
  return "Cancelled";
}

function requestUpdateCopy(step: string) {
  const normalizedStep = String(step || "").trim().toUpperCase();

  if (normalizedStep === "VERIFICATION") {
    return {
      title: "Report received",
      body: "Your emergency report is being verified now.",
    };
  }
  if (normalizedStep === "ASSIGNED") {
    return {
      title: "Responder assigned",
      body: "A responder has been assigned to your emergency request.",
    };
  }
  if (normalizedStep === "EN ROUTE") {
    return {
      title: "Responder en route",
      body: "Your responder is on the way.",
    };
  }
  if (normalizedStep === "ARRIVED") {
    return {
      title: "Responder arrived",
      body: "Your responder has arrived at your location.",
    };
  }
  if (normalizedStep === "RESOLVED") {
    return {
      title: "Request resolved",
      body: "Your emergency request has been marked resolved. Please leave a review.",
    };
  }
  if (normalizedStep === "CANCELLED" || normalizedStep === "CANCELED" || normalizedStep === "REJECTED") {
    return {
      title: "Request cancelled",
      body: "Your emergency request has been cancelled.",
    };
  }

  return {
    title: "Request submitted",
    body: "Your emergency request has been received.",
  };
}

export async function notifyRequestTrackingUpdated(
  requestId: string,
  reason: string,
  options?: { stepOverride?: string }
) {
  const normalizedRequestId = String(requestId || "").trim();
  if (!Types.ObjectId.isValid(normalizedRequestId)) return;

  const snapshot = await getEmergencyRequestTrackingSnapshot(normalizedRequestId);
  if (!snapshot) return;

  await emitRequestTrackingUpdate(normalizedRequestId, reason);

  const report = await EmergencyReport.findById(normalizedRequestId)
    .select("reportedBy")
    .lean();

  const ownerUserId = report?.reportedBy ? String(report.reportedBy) : "";
  if (!Types.ObjectId.isValid(ownerUserId)) return;

  const step = options?.stepOverride?.trim() || trackingStepFromLabel(snapshot.tracking.label);
  const copy = requestUpdateCopy(step);

  emitUserNotification(ownerUserId, "notify:request_update", {
    type: "REQUEST_UPDATE",
    requestId: normalizedRequestId,
    step,
    screen: "my-request-tracking",
    title: copy.title,
    body: copy.body,
  });

  await sendRequestStatusPush({
    userId: ownerUserId,
    requestId: normalizedRequestId,
    step,
    title: copy.title,
    body: copy.body,
  });
}
