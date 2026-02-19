import type { Request, Response } from "express";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import {
  getMyLatestApplication,
  getVolunteerApplicationByIdForReviewer,
  listVolunteerApplicationsForReviewer,
  reviewVolunteerApplication,
  submitVolunteerApplication,
} from "./volunteerApplication.service";
import {
  createVolunteerApplicationSchema,
  reviewVolunteerApplicationSchema,
} from "./volunteerApplication.validation";

type UserCtx = { id: string; role: string };
type ListQuery = {
  status?: string;
  q?: string;
  page?: string;
  limit?: string;
};
type IdParams = { id: string };

function getUser(req: Request) {
  return (req as any).user as UserCtx | undefined;
}

export async function postVolunteerApplication(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const parsed = createVolunteerApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid form data", errors: parsed.error.flatten() });
  }

  try {
    const created = await submitVolunteerApplication(user.id, parsed.data);
    await logAudit(req, {
      eventType: AUDIT_EVENT.VOLUNTEER_APPLICATION_CREATE,
      outcome: "SUCCESS",
      actor: { id: user.id, role: user.role },
      target: {
        type: "VOLUNTEER_APPLICATION",
        id: String((created as any)?._id ?? ""),
      },
      metadata: { status: (created as any)?.status ?? "pending_verification" },
    });

    return res.status(201).json(created);
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Failed to submit application" });
  }
}

export async function getMyLatest(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const doc = await getMyLatestApplication(user.id);
  if (!doc) return res.status(404).json({ message: "No application found" });
  return res.json(doc);
}

export async function postReview(req: Request<IdParams>, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  if (!["LGU", "ADMIN"].includes(user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = reviewVolunteerApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid review payload", errors: parsed.error.flatten() });
  }

  const updated = await reviewVolunteerApplication({
    applicationId: req.params.id,
    reviewerId: user.id,
    action: parsed.data.action,
    notes: parsed.data.notes,
  });

  if (!updated) return res.status(404).json({ message: "Application not found" });

  const reviewAction = String(parsed.data.action).toLowerCase();
  const reviewEventType =
    reviewAction === "approve"
      ? AUDIT_EVENT.VOLUNTEER_APPLICATION_APPROVE
      : reviewAction === "reject"
        ? AUDIT_EVENT.VOLUNTEER_APPLICATION_REJECT
        : AUDIT_EVENT.VOLUNTEER_APPLICATION_REVIEW;

  await logAudit(req, {
    eventType: reviewEventType,
    outcome: "SUCCESS",
    actor: { id: user.id, role: user.role },
    target: {
      type: "VOLUNTEER_APPLICATION",
      id: String((updated as any)?._id ?? req.params.id),
    },
    metadata: { action: parsed.data.action },
  });

  return res.json(updated);
}

export async function listVolunteerApplications(
  req: Request<{}, {}, {}, ListQuery>,
  res: Response
) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  if (!["LGU", "ADMIN"].includes(user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const statusParam = (req.query.status ?? "").trim();
  const statuses = statusParam ? statusParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const q = (req.query.q ?? "").trim() || undefined;
  const pageRaw = parseInt(req.query.page ?? "1", 10);
  const limitRaw = parseInt(req.query.limit ?? "20", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 20;

  const result = await listVolunteerApplicationsForReviewer({
    reviewerId: user.id,
    reviewerRole: user.role,
    statuses,
    q,
    page,
    limit,
  });

  return res.json(result);
}

export async function getVolunteerApplicationById(req: Request<IdParams>, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  if (!["LGU", "ADMIN"].includes(user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const doc = await getVolunteerApplicationByIdForReviewer({
    reviewerId: user.id,
    reviewerRole: user.role,
    applicationId: req.params.id,
  });

  if (!doc) return res.status(404).json({ message: "Application not found" });
  return res.json(doc);
}
