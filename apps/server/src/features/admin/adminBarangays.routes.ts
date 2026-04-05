import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireAdminTier } from "../../middlewares/requireAdminTier";
import { requirePerm } from "../../middlewares/requirePerm";
import { validate } from "../../middlewares/validate";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import { BarangayModel } from "../barangays/barangay.model";

const barangayListQuerySchema = z.object({
  q: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const geoJsonGeometrySchema = z.object({
  type: z.enum(["Polygon", "MultiPolygon"]),
  coordinates: z.array(z.any()),
});

const createBarangaySchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1).default("Dagupan City"),
  province: z.string().trim().min(1).default("Pangasinan"),
  code: z.string().trim().optional(),
  geometry: geoJsonGeometrySchema.optional(),
  isActive: z.boolean().optional(),
});

const updateBarangaySchema = createBarangaySchema.partial();

const barangayParamsSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid barangay id"),
});

export const adminBarangaysRouter = Router();

adminBarangaysRouter.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "LGU"),
  requirePerm("barangays.view"),
  validate(barangayListQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as unknown as z.infer<typeof barangayListQuerySchema>;
    const page = query.page;
    const limit = query.limit;

    const filter: Record<string, unknown> = {};
    if (query.isActive === "true" || query.isActive === "false") {
      filter.isActive = query.isActive === "true";
    }
    if (query.q) {
      const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [{ name: searchRegex }, { code: searchRegex }, { city: searchRegex }, { province: searchRegex }];
    }

    const [items, total] = await Promise.all([
      BarangayModel.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      BarangayModel.countDocuments(filter),
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

adminBarangaysRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("barangays.edit"),
  validate(createBarangaySchema),
  async (req, res) => {
    const payload = req.body as z.infer<typeof createBarangaySchema>;

    const created = await BarangayModel.create({
      name: payload.name,
      city: payload.city,
      province: payload.province,
      code: payload.code,
      geometry: payload.geometry,
      isActive: payload.isActive ?? true,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "BARANGAY_CREATE",
      outcome: "SUCCESS",
      actor: { id: req.userId, role: req.role },
      target: { type: "BARANGAY", id: String(created._id) },
      metadata: {
        name: payload.name,
        city: payload.city,
        province: payload.province,
        isActive: payload.isActive ?? true,
      },
    });

    return res.status(201).json({ item: created.toObject() });
  }
);

adminBarangaysRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("barangays.edit"),
  validate(barangayParamsSchema, "params"),
  validate(updateBarangaySchema),
  async (req, res) => {
    const payload = req.body as z.infer<typeof updateBarangaySchema>;
    const barangayId = String(req.params.id);
    const updated = await BarangayModel.findByIdAndUpdate(barangayId, { $set: payload }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "BARANGAY_UPDATE",
      outcome: "SUCCESS",
      actor: { id: req.userId, role: req.role },
      target: { type: "BARANGAY", id: barangayId },
      metadata: payload,
    });

    return res.json({ item: updated });
  }
);

adminBarangaysRouter.post(
  "/:id/deactivate",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("barangays.edit"),
  validate(barangayParamsSchema, "params"),
  async (req, res) => {
    const barangayId = String(req.params.id);
    const updated = await BarangayModel.findByIdAndUpdate(barangayId, { $set: { isActive: false } }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "BARANGAY_DEACTIVATE",
      outcome: "SUCCESS",
      actor: { id: req.userId, role: req.role },
      target: { type: "BARANGAY", id: barangayId },
    });

    return res.json({ item: updated });
  }
);

adminBarangaysRouter.post(
  "/:id/activate",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("barangays.edit"),
  validate(barangayParamsSchema, "params"),
  async (req, res) => {
    const barangayId = String(req.params.id);
    const updated = await BarangayModel.findByIdAndUpdate(barangayId, { $set: { isActive: true } }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "BARANGAY_ACTIVATE",
      outcome: "SUCCESS",
      actor: { id: req.userId, role: req.role },
      target: { type: "BARANGAY", id: barangayId },
    });

    return res.json({ item: updated });
  }
);
