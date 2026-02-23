import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireAdminTier } from "../../middlewares/requireAdminTier";
import { requirePerm } from "../../middlewares/requirePerm";
import { validate } from "../../middlewares/validate";
import { User } from "../users/user.model";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import { BarangayModel } from "../barangays/barangay.model";
import rbacRoutes from "../rbac/rbac.routes";
import masterDataRoutes from "../masterData/masterData.routes";
import analyticsRoutes from "../analytics/analytics.routes";
import { adminAnnouncementsRouter } from "../announcements/announcements.routes";
import { getRolePermissions } from "../rbac/rbac.service";

const router = Router();

const userListQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(["ADMIN", "LGU", "VOLUNTEER", "COMMUNITY"]).optional(),
  adminTier: z.enum(["SUPER", "CDRRMO"]).optional(),
  barangay: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  role: z.enum(["LGU", "ADMIN"]),
  barangay: z.string().trim().optional(),
  lguName: z.string().trim().optional(),
  lguPosition: z.string().trim().optional(),
  municipality: z.string().trim().optional(),
  adminTier: z.enum(["CDRRMO"]).optional(),
  isActive: z.boolean().optional(),
});

const updateUserParamsSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid user id"),
});

const superUpdateUserSchema = z.object({
  username: z.string().trim().min(3).max(64).optional(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  role: z.enum(["ADMIN", "LGU", "VOLUNTEER", "COMMUNITY"]).optional(),
  adminTier: z.enum(["CDRRMO"]).optional(),
  barangay: z.string().trim().optional(),
  municipality: z.string().trim().optional(),
  lguName: z.string().trim().optional(),
  lguPosition: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

const cdrrmoUpdateUserSchema = z.object({
  isActive: z.boolean(),
});

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

type AdminTier = "SUPER" | "CDRRMO";

async function resolveActorAdminTier(userId: string | undefined): Promise<AdminTier | null> {
  if (!userId) return null;
  const actor = await User.findById(userId).select("role adminTier").lean();
  if (!actor || actor.role !== "ADMIN") return null;
  return (actor.adminTier ?? "CDRRMO") as AdminTier;
}

function isTargetSuperAdmin(target: { role?: string; adminTier?: string }) {
  return target.role === "ADMIN" && target.adminTier === "SUPER";
}

function buildUserSearchFilter(query: z.infer<typeof userListQuerySchema>, adminTier: AdminTier) {
  const filter: Record<string, unknown> = {};

  if (adminTier === "CDRRMO") {
    filter.role = { $in: ["VOLUNTEER", "COMMUNITY", "LGU"] };
  } else if (query.role) {
    filter.role = query.role;
  }

  if (adminTier === "SUPER" && query.adminTier) {
    filter.adminTier = query.adminTier;
  }

  if (query.barangay) {
    filter.barangay = query.barangay;
  }

  if (query.isActive === "true" || query.isActive === "false") {
    filter.isActive = query.isActive === "true";
  }

  if (query.q) {
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");
    filter.$or = [
      { username: searchRegex },
      { email: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { barangay: searchRegex },
    ];
  }

  return filter;
}

router.get(
  "/users",
  requireAuth,
  requireRole("ADMIN"),
  requirePerm("users.view"),
  validate(userListQuerySchema, "query"),
  async (req, res) => {
    const actorTier = await resolveActorAdminTier(req.userId);
    if (!actorTier) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const query = req.query as unknown as z.infer<typeof userListQuerySchema>;
    const page = query.page;
    const limit = query.limit;

    const filter = buildUserSearchFilter(query, actorTier);

    const [items, total] = await Promise.all([
      User.find(filter)
        .select(
          "username email firstName lastName role adminTier lguName lguPosition barangay municipality volunteerStatus isActive createdAt updatedAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
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

router.post(
  "/users",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  validate(createUserSchema),
  async (req, res) => {
    const payload = req.body as z.infer<typeof createUserSchema>;
    const superPermissions = await getRolePermissions("SUPER_ADMIN");

    if (payload.role === "ADMIN") {
      if (!payload.email) {
        return res.status(400).json({ message: "email is required for ADMIN accounts" });
      }
      if (payload.adminTier && payload.adminTier !== "CDRRMO") {
        return res.status(400).json({ message: "Only CDRRMO admin accounts can be created via API" });
      }
      if (!superPermissions.has("users.manage_admin_accounts")) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (payload.role === "LGU") {
      if (!payload.barangay) {
        return res.status(400).json({ message: "barangay is required for LGU accounts" });
      }
      if (!superPermissions.has("users.manage_lgu_accounts")) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const created = await User.create({
      username: payload.username,
      email: payload.email,
      passwordHash,
      role: payload.role,
      adminTier: payload.role === "ADMIN" ? "CDRRMO" : undefined,
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
      lguName: payload.role === "LGU" ? payload.lguName ?? payload.barangay ?? "" : "",
      lguPosition: payload.role === "LGU" ? payload.lguPosition ?? "" : "",
      barangay: payload.role === "LGU" ? payload.barangay ?? "" : "",
      municipality: payload.role === "LGU" ? "Dagupan City" : payload.municipality ?? "",
      volunteerStatus: "NONE",
      isActive: payload.isActive ?? true,
      emailVerified: payload.role === "ADMIN",
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.USER_CREATE,
      outcome: "SUCCESS",
      actor: { id: req.userId, role: req.role },
      target: { type: "USER", id: String(created._id) },
      metadata: {
        role: payload.role,
        adminTier: payload.role === "ADMIN" ? "CDRRMO" : undefined,
        barangay: payload.barangay ?? null,
      },
    });

    return res.status(201).json({
      item: created.toObject(),
    });
  }
);

router.patch(
  "/users/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(updateUserParamsSchema, "params"),
  async (req, res) => {
    const actorTier = await resolveActorAdminTier(req.userId);
    if (!actorTier) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const targetUserId = String(req.params.id);
    const targetUser = await User.findById(targetUserId).select("role adminTier").lean();
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isTargetSuperAdmin(targetUser)) {
      return res.status(403).json({ message: "SUPER admin accounts cannot be edited via this API" });
    }

    if (actorTier === "SUPER") {
      const parsed = superUpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
      }

      const superPermissions = await getRolePermissions("SUPER_ADMIN");
      const updates = { ...parsed.data } as Record<string, unknown>;

      if (updates.role === "ADMIN") {
        if (!superPermissions.has("users.manage_admin_accounts")) {
          return res.status(403).json({ message: "Forbidden" });
        }
        updates.adminTier = "CDRRMO";
      }

      if (updates.role === "LGU") {
        if (!superPermissions.has("users.manage_lgu_accounts")) {
          return res.status(403).json({ message: "Forbidden" });
        }
        updates.municipality = "Dagupan City";
      }

      const updated = await User.findByIdAndUpdate(targetUserId, { $set: updates }, { new: true })
        .select(
          "username email firstName lastName role adminTier lguName lguPosition barangay municipality volunteerStatus isActive createdAt updatedAt"
        )
        .lean();

      await logAudit(req, {
        eventType: AUDIT_EVENT.DISPATCH_UPDATE,
        action: "USER_UPDATE",
        outcome: "SUCCESS",
        actor: { id: req.userId, role: req.role },
        target: { type: "USER", id: targetUserId },
        metadata: updates,
      });

      return res.json({ item: updated });
    }

    const cdrrmoPermissions = await getRolePermissions("CDRRMO_ADMIN");
    if (!cdrrmoPermissions.has("users.manage_volunteers")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (targetUser.role !== "VOLUNTEER" && targetUser.role !== "COMMUNITY") {
      return res.status(403).json({ message: "CDRRMO admins can only update volunteer/community accounts" });
    }

    const parsed = cdrrmoUpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
    }

    const updated = await User.findByIdAndUpdate(targetUserId, { $set: parsed.data }, { new: true })
      .select(
        "username email firstName lastName role adminTier lguName lguPosition barangay municipality volunteerStatus isActive createdAt updatedAt"
      )
      .lean();

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "USER_UPDATE",
      outcome: "SUCCESS",
      actor: { id: req.userId, role: req.role },
      target: { type: "USER", id: targetUserId },
      metadata: parsed.data,
    });

    return res.json({ item: updated });
  }
);

async function updateUserActivation(req: any, res: any, isActive: boolean) {
  const actorTier = await resolveActorAdminTier(req.userId);
  if (!actorTier) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const targetUserId = String(req.params.id);
  const targetUser = await User.findById(targetUserId).select("role adminTier").lean();
  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (isTargetSuperAdmin(targetUser)) {
    return res.status(403).json({ message: "SUPER admin accounts cannot be modified via this API" });
  }

  const rolePermissions = await getRolePermissions(actorTier === "SUPER" ? "SUPER_ADMIN" : "CDRRMO_ADMIN");
  const requiredPermission =
    targetUser.role === "LGU" ? "users.manage_lgu_accounts" : "users.manage_volunteers";
  if (!rolePermissions.has(requiredPermission)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (actorTier === "CDRRMO" && targetUser.role !== "VOLUNTEER" && targetUser.role !== "COMMUNITY") {
    return res.status(403).json({ message: "CDRRMO admins can only suspend/reactivate volunteer/community accounts" });
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    { $set: { isActive } },
    { new: true }
  )
    .select(
      "username email firstName lastName role adminTier lguName lguPosition barangay municipality volunteerStatus isActive createdAt updatedAt"
    )
    .lean();

  await logAudit(req, {
    eventType: isActive ? AUDIT_EVENT.ADMIN_ACCOUNT_ENABLE : AUDIT_EVENT.ADMIN_ACCOUNT_DISABLE,
    outcome: "SUCCESS",
    actor: { id: req.userId, role: req.role },
    target: { type: "USER", id: targetUserId },
    metadata: {
      role: targetUser.role,
      adminTier: targetUser.adminTier ?? null,
    },
  });

  return res.json({ item: updated });
}

router.post(
  "/users/:id/suspend",
  requireAuth,
  requireRole("ADMIN"),
  validate(updateUserParamsSchema, "params"),
  async (req, res) => updateUserActivation(req, res, false)
);

router.post(
  "/users/:id/reactivate",
  requireAuth,
  requireRole("ADMIN"),
  validate(updateUserParamsSchema, "params"),
  async (req, res) => updateUserActivation(req, res, true)
);

router.get(
  "/barangays",
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
      BarangayModel.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
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

router.post(
  "/barangays",
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

router.patch(
  "/barangays/:id",
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

router.post(
  "/barangays/:id/deactivate",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("barangays.edit"),
  validate(barangayParamsSchema, "params"),
  async (req, res) => {
    const barangayId = String(req.params.id);
    const updated = await BarangayModel.findByIdAndUpdate(
      barangayId,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

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

router.post(
  "/barangays/:id/activate",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("barangays.edit"),
  validate(barangayParamsSchema, "params"),
  async (req, res) => {
    const barangayId = String(req.params.id);
    const updated = await BarangayModel.findByIdAndUpdate(
      barangayId,
      { $set: { isActive: true } },
      { new: true }
    ).lean();

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

router.use("/rbac", rbacRoutes);
router.use("/masterdata", masterDataRoutes);
router.use("/announcements", adminAnnouncementsRouter);
router.use("/analytics", analyticsRoutes);

export default router;
