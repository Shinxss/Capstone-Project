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

type AnnouncementQuery = z.infer<typeof listQuerySchema>;
type AnnouncementCreatePayload = z.infer<typeof createAnnouncementSchema>;
type AnnouncementUpdatePayload = z.infer<typeof updateAnnouncementSchema>;

function buildAnnouncementFilter(query: z.infer<typeof listQuerySchema>) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (query.status) filter.status = query.status;
  if (query.audience) filter.audience = query.audience;

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");
    filter.$or = [{ title: searchRegex }, { body: searchRegex }];
  }

  return filter;
}

function resolveActorRole(req: { role?: string; user?: { role?: string } }) {
  return String(req.role ?? req.user?.role ?? "").toUpperCase();
}

function resolveActorObjectId(userId?: string) {
  if (!userId || !Types.ObjectId.isValid(userId)) return null;
  return new Types.ObjectId(userId);
}

function buildLguActorScope(req: { role?: string; user?: { role?: string }; userId?: string }) {
  if (resolveActorRole(req) !== "LGU") return {};

  const actorObjectId = resolveActorObjectId(req.userId);
  if (!actorObjectId) {
    return { _id: { $exists: false } };
  }

  return { createdBy: actorObjectId };
}

function buildManagedAnnouncementTargetFilter(
  req: { role?: string; user?: { role?: string }; userId?: string },
  announcementId: string
) {
  const filter: Record<string, unknown> = {
    _id: announcementId,
    deletedAt: null,
  };

  const actorScope = buildLguActorScope(req);
  for (const [key, value] of Object.entries(actorScope)) {
    filter[key] = value;
  }

  return filter;
}

async function listAnnouncementsFromDb(query: AnnouncementQuery, extraFilter: Record<string, unknown> = {}) {
  const page = query.page;
  const limit = query.limit;
  const filter = {
    ...buildAnnouncementFilter(query),
    ...extraFilter,
  };

  const [items, total] = await Promise.all([
    AnnouncementModel.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "username firstName lastName role")
      .lean(),
    AnnouncementModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function createAnnouncementInDb(payload: AnnouncementCreatePayload, userId?: string) {
  return AnnouncementModel.create({
    ...payload,
    status: payload.status ?? "DRAFT",
    createdBy: resolveActorObjectId(userId) ?? undefined,
    publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
  });
}

export const adminAnnouncementsRouter = Router();

adminAnnouncementsRouter.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate(listQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as unknown as AnnouncementQuery;
    const response = await listAnnouncementsFromDb(query);
    return res.json(response);
  }
);

adminAnnouncementsRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  requirePerm("announcements.manage"),
  validate(createAnnouncementSchema),
  async (req, res) => {
    const payload = req.body as AnnouncementCreatePayload;
    const created = await createAnnouncementInDb(payload, req.userId);

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
    const payload = req.body as AnnouncementUpdatePayload;
    const updated = await AnnouncementModel.findOneAndUpdate(
      { _id: announcementId, deletedAt: null },
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
    const updated = await AnnouncementModel.findOneAndUpdate(
      { _id: announcementId, deletedAt: null },
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
    const updated = await AnnouncementModel.findOneAndUpdate(
      { _id: announcementId, deletedAt: null },
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
    const deletePatch: Record<string, unknown> = {
      deletedAt: new Date(),
      deletedBy: req.userId ? new Types.ObjectId(req.userId) : null,
      status: "DRAFT",
      publishedAt: null,
    };
    const deleted = await AnnouncementModel.findOneAndUpdate(
      { _id: announcementId, deletedAt: null },
      { $set: deletePatch },
      { new: true }
    ).lean();
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

export const lguAnnouncementsRouter = Router();

lguAnnouncementsRouter.get(
  "/",
  requireAuth,
  requireRole("LGU"),
  validate(listQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as unknown as AnnouncementQuery;
    const response = await listAnnouncementsFromDb(query, buildLguActorScope(req));
    return res.json(response);
  }
);

lguAnnouncementsRouter.post(
  "/",
  requireAuth,
  requireRole("LGU"),
  validate(createAnnouncementSchema),
  async (req, res) => {
    const payload = req.body as AnnouncementCreatePayload;
    const created = await createAnnouncementInDb(payload, req.userId);

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

lguAnnouncementsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("LGU"),
  validate(announcementIdParamSchema, "params"),
  validate(updateAnnouncementSchema),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const payload = req.body as AnnouncementUpdatePayload;
    const updated = await AnnouncementModel.findOneAndUpdate(
      buildManagedAnnouncementTargetFilter(req, announcementId),
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

lguAnnouncementsRouter.post(
  "/:id/publish",
  requireAuth,
  requireRole("LGU"),
  validate(announcementIdParamSchema, "params"),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const updated = await AnnouncementModel.findOneAndUpdate(
      buildManagedAnnouncementTargetFilter(req, announcementId),
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

lguAnnouncementsRouter.post(
  "/:id/unpublish",
  requireAuth,
  requireRole("LGU"),
  validate(announcementIdParamSchema, "params"),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const updated = await AnnouncementModel.findOneAndUpdate(
      buildManagedAnnouncementTargetFilter(req, announcementId),
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

lguAnnouncementsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("LGU"),
  validate(announcementIdParamSchema, "params"),
  async (req, res) => {
    const announcementId = String(req.params.id);
    const deleted = await AnnouncementModel.findOneAndUpdate(
      buildManagedAnnouncementTargetFilter(req, announcementId),
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: resolveActorObjectId(req.userId),
          status: "DRAFT",
          publishedAt: null,
        },
      },
      { new: true }
    ).lean();

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

publicAnnouncementsRouter.use("/", lguAnnouncementsRouter);

publicAnnouncementsRouter.get("/feed", async (_req, res) => {
  const items = await AnnouncementModel.find({ status: "PUBLISHED", deletedAt: null })
    .sort({ publishedAt: -1, _id: -1 })
    .lean();

  return res.json({ items });
});

export default publicAnnouncementsRouter;
