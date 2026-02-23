import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireAdminTier } from "../../middlewares/requireAdminTier";
import { validate } from "../../middlewares/validate";
import { ROLE_PROFILE_KEYS } from "./role.model";
import { RBAC_PERMISSIONS } from "./permissions.constants";
import { listRoleProfiles, updateRoleProfilePermissions } from "./rbac.service";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";

const router = Router();

const roleKeySchema = z.object({
  key: z.enum(ROLE_PROFILE_KEYS),
});

const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(RBAC_PERMISSIONS)).default([]),
});

router.get(
  "/roles",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  async (_req, res) => {
    const items = await listRoleProfiles();
    return res.json({ items });
  }
);

router.patch(
  "/roles/:key",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  validate(roleKeySchema, "params"),
  validate(updateRolePermissionsSchema),
  async (req, res) => {
    const roleKey = req.params.key as (typeof ROLE_PROFILE_KEYS)[number];
    const { permissions } = req.body as z.infer<typeof updateRolePermissionsSchema>;

    const updated = await updateRoleProfilePermissions(roleKey, permissions);

    await logAudit(req, {
      eventType: AUDIT_EVENT.ADMIN_ROLE_CHANGE,
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "ROLE_PROFILE",
        id: roleKey,
      },
      metadata: {
        permissions,
      },
    });

    return res.json({ item: updated });
  }
);

router.get(
  "/perms",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  (_req, res) => {
    return res.json({ items: RBAC_PERMISSIONS });
  }
);

export default router;
