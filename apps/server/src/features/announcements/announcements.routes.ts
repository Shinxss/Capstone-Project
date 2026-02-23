import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requirePerm } from "../../middlewares/requirePerm";
import { requireAdminTier } from "../../middlewares/requireAdminTier";
import { validate } from "../../middlewares/validate";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import { AnnouncementModel } from "./announcement.model";

const listQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  audience: z.enum(["LGU", "VOLUNTEER", "PUBLIC", "ALL"]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(5).max(5000),
  audience: z.enum(["LGU", "VOLUNTEER", "PUBLIC", "ALL"]),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

const updateAnnouncementSchema = createAnnouncementSchema.partial();

const announcementIdParamSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});

function buildAnnouncementFilter(query: z.infer<typeof listQuerySchema>) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.audience) filter.audience = query.audience;

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");
    filter.$or = [{ title: searchRegex }, { body: searchRegex }];
  }

  return filter;
}

export const adminAnnouncementsRouter = Router();

adminAnnouncementsRouter.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;
    const page = query.page;
    const limit = query.limit;

    const filter = buildAnnouncementFilter(query);
    const [items, total] = await Promise.all([
      AnnouncementModel.find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "username firstName lastName role")
        .lean(),
      AnnouncementModel.countDocuments(filter),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }
);

adminAnnouncementsRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  requirePerm("announcements.manage"),
  validate(createAnnouncementSchema),
  async (req, res) => {
    const payload = req.body as z.infer<typeof createAnnouncementSchema>;
    const created = await AnnouncementModel.create({
      ...payload,
      status: payload.status ?? "DRAFT",
      createdBy: req.userId ? new Types.ObjectId(req.userId) : undefined,
      publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "ANNOUNCEMENT_CREATE",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "ANNOUNCEMENT",
        id: String(created._id),
      },
      metadata: {
        status: payload.status ?? "DRAFT",
        audience: payload.audience,
        title: payload.title,
      },
    });

    return res.status(201).json({ item: created.toObject() });
  }
);

adminAnnouncementsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requirePerm("announcements.manage"),
  validate(announcementIdParamSchema, "params"),
  validate(updateAnnouncementSchema),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const payload = req.body as z.infer<typeof updateAnnouncementSchema>;
    const updated = await AnnouncementModel.findByIdAndUpdate(
      announcementId,
      {
        $set: payload,
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "ANNOUNCEMENT_UPDATE",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "ANNOUNCEMENT",
        id: announcementId,
      },
      metadata: payload,
    });

    return res.json({ item: updated });
  }
);

adminAnnouncementsRouter.post(
  "/:id/publish",
  requireAuth,
  requireRole("ADMIN"),
  requirePerm("announcements.manage"),
  validate(announcementIdParamSchema, "params"),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const updated = await AnnouncementModel.findByIdAndUpdate(
      announcementId,
      {
        $set: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "ANNOUNCEMENT_PUBLISH",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "ANNOUNCEMENT",
        id: announcementId,
      },
    });

    return res.json({ item: updated });
  }
);

adminAnnouncementsRouter.post(
  "/:id/unpublish",
  requireAuth,
  requireRole("ADMIN"),
  requirePerm("announcements.manage"),
  validate(announcementIdParamSchema, "params"),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const updated = await AnnouncementModel.findByIdAndUpdate(
      announcementId,
      {
        $set: {
          status: "DRAFT",
          publishedAt: null,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "ANNOUNCEMENT_UNPUBLISH",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "ANNOUNCEMENT",
        id: announcementId,
      },
    });

    return res.json({ item: updated });
  }
);

adminAnnouncementsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  validate(announcementIdParamSchema, "params"),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const deleted = await AnnouncementModel.findByIdAndDelete(announcementId).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "ANNOUNCEMENT_DELETE",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "ANNOUNCEMENT",
        id: announcementId,
      },
    });

    return res.json({ success: true });
  }
);

const publicAnnouncementsRouter = Router();

publicAnnouncementsRouter.get("/feed", async (_req, res) => {
  const items = await AnnouncementModel.find({ status: "PUBLISHED" })
    .sort({ publishedAt: -1, _id: -1 })
    .lean();

  return res.json({ items });
});

export default publicAnnouncementsRouter;
