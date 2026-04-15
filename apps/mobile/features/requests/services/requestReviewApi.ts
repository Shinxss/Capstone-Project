import { api } from "../../../lib/api";
import type {
  MyRequestReviewDTO,
  RequestReviewRecord,
  RequestReviewVolunteer,
  UpsertMyRequestReviewInput,
} from "../models/requestReview";

const MY_REQUESTS_BASE = "/api/emergency/reports";

function unwrapData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const data = (payload as any).data;
  return data === undefined ? payload : data;
}

function toTrimmedString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeVolunteer(raw: any): RequestReviewVolunteer | null {
  if (!raw || typeof raw !== "object") return null;

  const id = toTrimmedString(raw?.id ?? raw?._id);
  const name = toTrimmedString(raw?.name);
  if (!id && !name) return null;

  const lifelineId = toTrimmedString(raw?.lifelineId);
  const avatarUrl = toTrimmedString(raw?.avatarUrl);
  return {
    id,
    name: name || "Assigned volunteer",
    ...(lifelineId ? { lifelineId } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

function normalizeReview(raw: any): RequestReviewRecord | null {
  if (!raw || typeof raw !== "object") return null;

  const id = toTrimmedString(raw?.id ?? raw?._id);
  const rating = Number(raw?.rating);
  if (!id || !Number.isFinite(rating)) return null;

  return {
    id,
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    comment: toTrimmedString(raw?.comment),
    createdAt: toTrimmedString(raw?.createdAt),
    updatedAt: toTrimmedString(raw?.updatedAt),
  };
}

function normalizeMyRequestReview(raw: any): MyRequestReviewDTO {
  const requestId = toTrimmedString(raw?.requestId ?? raw?.id);
  const reason = toTrimmedString(raw?.reason);
  const emergencyStatus = toTrimmedString(raw?.requestStatus?.emergencyStatus);
  const verificationStatus = toTrimmedString(raw?.requestStatus?.verificationStatus);
  const dispatchStatusRaw = raw?.requestStatus?.dispatchStatus;
  const dispatchStatus = dispatchStatusRaw === null ? null : toTrimmedString(dispatchStatusRaw);

  return {
    requestId,
    reviewable: Boolean(raw?.reviewable),
    ...(reason ? { reason } : {}),
    ...(emergencyStatus || verificationStatus || dispatchStatusRaw === null
      ? {
          requestStatus: {
            emergencyStatus,
            verificationStatus,
            dispatchStatus: dispatchStatusRaw === null ? null : dispatchStatus,
          },
        }
      : {}),
    volunteer: normalizeVolunteer(raw?.volunteer),
    review: normalizeReview(raw?.review),
  };
}

export async function fetchMyRequestReview(requestId: string): Promise<MyRequestReviewDTO> {
  const normalizedId = toTrimmedString(requestId);
  if (!normalizedId) throw new Error("Request id is required");

  const res = await api.get<unknown>(`${MY_REQUESTS_BASE}/my/${normalizedId}/review`);
  return normalizeMyRequestReview(unwrapData(res.data));
}

export async function upsertMyRequestReview(
  requestId: string,
  input: UpsertMyRequestReviewInput
): Promise<MyRequestReviewDTO> {
  const normalizedId = toTrimmedString(requestId);
  if (!normalizedId) throw new Error("Request id is required");

  const payload = {
    rating: Math.max(1, Math.min(5, Math.round(Number(input.rating)))),
    comment: toTrimmedString(input.comment),
  };

  const res = await api.put<unknown>(`${MY_REQUESTS_BASE}/my/${normalizedId}/review`, payload);
  return normalizeMyRequestReview(unwrapData(res.data));
}
