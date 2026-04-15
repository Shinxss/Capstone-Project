import { Types, isValidObjectId } from "mongoose";
import { EmergencyReportModel } from "../emergency/models/EmergencyReport.model";
import { DispatchOffer } from "../dispatches/dispatch.model";
import { User } from "../users/user.model";
import { VolunteerReview } from "./volunteerReview.model";
import type { UpsertVolunteerReviewInput } from "./volunteerReview.validation";

export type MyRequestReviewDTO = {
  requestId: string;
  reviewable: boolean;
  reason?: string;
  requestStatus: {
    emergencyStatus: string;
    verificationStatus: string;
    dispatchStatus: string | null;
  };
  volunteer: {
    id: string;
    name: string;
    lifelineId?: string;
    avatarUrl?: string;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type ReviewReadResult =
  | { code: "OK"; data: MyRequestReviewDTO }
  | { code: "INVALID_ID" }
  | { code: "NOT_FOUND" }
  | { code: "FORBIDDEN" };

type ReviewUpsertResult =
  | { code: "OK"; data: MyRequestReviewDTO; created: boolean }
  | { code: "INVALID_ID" }
  | { code: "NOT_FOUND" }
  | { code: "FORBIDDEN" }
  | { code: "NOT_REVIEWABLE"; reason: string }
  | { code: "CONFLICT"; message: string };

type ReportReviewContext = {
  report: {
    _id: Types.ObjectId;
    reportedBy?: Types.ObjectId;
    status?: string;
    verification?: {
      status?: string;
    };
  };
  completedDispatch: any | null;
  existingReview: any | null;
  reviewable: boolean;
  reason?: string;
};

type LoadContextResult =
  | { code: "OK"; context: ReportReviewContext }
  | { code: "INVALID_ID" }
  | { code: "NOT_FOUND" }
  | { code: "FORBIDDEN" };

function toIsoString(value: unknown, fallback = new Date()) {
  const date = value instanceof Date ? value : new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return fallback.toISOString();
  return date.toISOString();
}

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function toObjectIdString(value: unknown) {
  if (!value) return "";
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "string" && isValidObjectId(value)) return new Types.ObjectId(value).toString();
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    const nested = (value as Record<string, unknown>)._id;
    if (nested instanceof Types.ObjectId) return nested.toString();
    if (typeof nested === "string" && isValidObjectId(nested)) {
      return new Types.ObjectId(nested).toString();
    }
  }
  return "";
}

function toTrimmedString(value: unknown) {
  return String(value ?? "").trim();
}

function toVolunteerName(volunteer: any) {
  const firstName = toTrimmedString(volunteer?.firstName);
  const lastName = toTrimmedString(volunteer?.lastName);
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Assigned volunteer";
}

function pickCompletedDispatchOffer(offers: any[]) {
  if (!Array.isArray(offers) || offers.length === 0) return null;
  const verified = offers.find((offer) => normalizeStatus(offer?.status) === "VERIFIED");
  if (verified) return verified;
  return offers.find((offer) => normalizeStatus(offer?.status) === "DONE") ?? null;
}

function determineReviewability(report: { status?: string; verification?: { status?: string } }, completedDispatch: any | null) {
  const emergencyStatus = normalizeStatus(report.status);
  const verificationStatus = toTrimmedString(report.verification?.status).toLowerCase();

  if (emergencyStatus === "CANCELLED" || verificationStatus === "rejected") {
    return {
      reviewable: false,
      reason: "Cancelled or rejected requests cannot be reviewed.",
    };
  }

  if (emergencyStatus !== "RESOLVED") {
    return {
      reviewable: false,
      reason: "Only resolved requests can be reviewed.",
    };
  }

  if (!completedDispatch) {
    return {
      reviewable: false,
      reason: "Only requests with a completed dispatch can be reviewed.",
    };
  }

  const volunteerId = toObjectIdString(completedDispatch?.volunteerId);
  if (!volunteerId) {
    return {
      reviewable: false,
      reason: "No completed volunteer assignment found for this request.",
    };
  }

  return { reviewable: true };
}

async function resolveVolunteerInfo(context: ReportReviewContext): Promise<MyRequestReviewDTO["volunteer"]> {
  const dispatchVolunteer = context.completedDispatch?.volunteerId;
  const dispatchVolunteerId = toObjectIdString(dispatchVolunteer);
  const reviewVolunteerId = toObjectIdString(context.existingReview?.volunteerId);
  const volunteerId = dispatchVolunteerId || reviewVolunteerId;
  if (!volunteerId) return null;

  if (dispatchVolunteer && typeof dispatchVolunteer === "object") {
    const lifelineId = toTrimmedString(dispatchVolunteer?.lifelineId);
    const avatarUrl = toTrimmedString(dispatchVolunteer?.avatarUrl);
    return {
      id: volunteerId,
      name: toVolunteerName(dispatchVolunteer),
      ...(lifelineId ? { lifelineId } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    };
  }

  const user = await User.findById(volunteerId)
    .select("_id firstName lastName lifelineId avatarUrl")
    .lean();

  if (!user) {
    return {
      id: volunteerId,
      name: "Assigned volunteer",
    };
  }

  const lifelineId = toTrimmedString(user.lifelineId);
  const avatarUrl = toTrimmedString(user.avatarUrl);
  return {
    id: String(user._id),
    name: toVolunteerName(user),
    ...(lifelineId ? { lifelineId } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

function toReviewDto(context: ReportReviewContext, volunteer: MyRequestReviewDTO["volunteer"]): MyRequestReviewDTO {
  const review = context.existingReview;
  const emergencyStatus = normalizeStatus(context.report.status);
  const verificationStatus = toTrimmedString(context.report.verification?.status).toLowerCase();
  const dispatchStatus = context.completedDispatch ? normalizeStatus(context.completedDispatch.status) : null;

  return {
    requestId: String(context.report._id),
    reviewable: context.reviewable,
    ...(context.reason ? { reason: context.reason } : {}),
    requestStatus: {
      emergencyStatus,
      verificationStatus,
      dispatchStatus,
    },
    volunteer,
    review: review
      ? {
          id: String(review._id),
          rating: Number(review.rating),
          comment: toTrimmedString(review.comment),
          createdAt: toIsoString(review.createdAt),
          updatedAt: toIsoString(review.updatedAt),
        }
      : null,
  };
}

async function loadReviewContext(reportId: string, reviewerUserId: string): Promise<LoadContextResult> {
  if (!isValidObjectId(reportId) || !isValidObjectId(reviewerUserId)) {
    return { code: "INVALID_ID" };
  }

  const report = await EmergencyReportModel.findById(reportId)
    .select("_id reportedBy status verification")
    .lean();

  if (!report) return { code: "NOT_FOUND" };
  if (!report.reportedBy || String(report.reportedBy) !== String(reviewerUserId)) {
    return { code: "FORBIDDEN" };
  }

  const reviewerObjectId = new Types.ObjectId(reviewerUserId);
  const [completedDispatches, existingReview] = await Promise.all([
    DispatchOffer.find({
      emergencyId: report._id,
      status: { $in: ["DONE", "VERIFIED"] },
    })
      .sort({ updatedAt: -1, _id: -1 })
      .select("_id volunteerId status completedAt verifiedAt updatedAt")
      .populate({ path: "volunteerId", select: "_id firstName lastName lifelineId avatarUrl" })
      .lean(),
    VolunteerReview.findOne({
      emergencyId: report._id,
      reviewerUserId: reviewerObjectId,
    })
      .select("_id emergencyId dispatchOfferId volunteerId reviewerUserId rating comment createdAt updatedAt")
      .lean(),
  ]);

  const completedDispatch = pickCompletedDispatchOffer(completedDispatches);
  const reviewability = determineReviewability(report, completedDispatch);

  return {
    code: "OK",
    context: {
      report,
      completedDispatch,
      existingReview,
      reviewable: reviewability.reviewable,
      reason: reviewability.reason,
    },
  };
}

function normalizeReviewComment(comment: unknown) {
  return toTrimmedString(comment).slice(0, 500);
}

export async function getMyRequestVolunteerReview(
  reportId: string,
  reviewerUserId: string
): Promise<ReviewReadResult> {
  const loaded = await loadReviewContext(reportId, reviewerUserId);
  if (loaded.code !== "OK") return loaded;

  const volunteer = await resolveVolunteerInfo(loaded.context);
  return {
    code: "OK",
    data: toReviewDto(loaded.context, volunteer),
  };
}

export async function upsertMyRequestVolunteerReview(
  reportId: string,
  reviewerUserId: string,
  input: UpsertVolunteerReviewInput
): Promise<ReviewUpsertResult> {
  const loaded = await loadReviewContext(reportId, reviewerUserId);
  if (loaded.code !== "OK") return loaded;

  const { context } = loaded;
  if (!context.reviewable) {
    return {
      code: "NOT_REVIEWABLE",
      reason: context.reason ?? "This request cannot be reviewed.",
    };
  }

  const dispatchId = toObjectIdString(context.completedDispatch?._id);
  const volunteerId = toObjectIdString(context.completedDispatch?.volunteerId);
  if (!dispatchId || !volunteerId) {
    return {
      code: "NOT_REVIEWABLE",
      reason: "No completed volunteer assignment found for this request.",
    };
  }

  const reviewerObjectId = new Types.ObjectId(reviewerUserId);
  const filter = {
    emergencyId: context.report._id,
    reviewerUserId: reviewerObjectId,
  };
  const update = {
    dispatchOfferId: new Types.ObjectId(dispatchId),
    volunteerId: new Types.ObjectId(volunteerId),
    rating: Math.max(1, Math.min(5, Math.round(Number(input.rating)))),
    comment: normalizeReviewComment(input.comment),
  };
  const created = !context.existingReview;

  try {
    await VolunteerReview.updateOne(filter, { $set: update }, { upsert: true });
  } catch (error: any) {
    if (Number(error?.code) === 11000) {
      await VolunteerReview.updateOne(filter, { $set: update });
    } else {
      throw error;
    }
  }

  const savedReview = await VolunteerReview.findOne(filter)
    .select("_id emergencyId dispatchOfferId volunteerId reviewerUserId rating comment createdAt updatedAt")
    .lean();

  if (!savedReview) {
    return {
      code: "CONFLICT",
      message: "Unable to save review. Please retry.",
    };
  }

  const nextContext: ReportReviewContext = {
    ...context,
    existingReview: savedReview,
  };
  const volunteer = await resolveVolunteerInfo(nextContext);

  return {
    code: "OK",
    created,
    data: toReviewDto(nextContext, volunteer),
  };
}

export async function getReviewedEmergencyIdSet(
  reviewerUserId: string,
  emergencyIds: Array<Types.ObjectId | string>
): Promise<Set<string>> {
  if (!isValidObjectId(reviewerUserId)) return new Set<string>();
  if (!Array.isArray(emergencyIds) || emergencyIds.length === 0) return new Set<string>();

  const normalizedEmergencyIds = emergencyIds
    .map((id) => toObjectIdString(id))
    .filter(Boolean)
    .map((id) => new Types.ObjectId(id));

  if (!normalizedEmergencyIds.length) return new Set<string>();

  const rows = await VolunteerReview.find({
    reviewerUserId: new Types.ObjectId(reviewerUserId),
    emergencyId: { $in: normalizedEmergencyIds },
  })
    .select("emergencyId")
    .lean();

  return new Set(rows.map((row) => String(row.emergencyId)));
}
