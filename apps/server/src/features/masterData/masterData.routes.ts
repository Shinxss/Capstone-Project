import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireAdminTier } from "../../middlewares/requireAdminTier";
import { requirePerm } from "../../middlewares/requirePerm";
import { validate } from "../../middlewares/validate";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import { MASTER_DATA_TYPES, type MasterDataType } from "./masterData.model";
import { createMasterData, listMasterData, updateMasterData } from "./masterData.service";

const router = Router();

const typeParamSchema = z.object({
  type: z.enum(MASTER_DATA_TYPES),
});

const idParamSchema = z.object({
  type: z.enum(MASTER_DATA_TYPES),
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});

const emergencyTypeCreateSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1),
  isActive: z.boolean().optional(),
});

const severityLevelCreateSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1),
  rank: z.number().int().min(1),
  isActive: z.boolean().optional(),
});

const taskTemplateCreateSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1),
  checklistItems: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().optional(),
});

const workflowCreateSchema = z.object({
  entityType: z.enum(["emergency", "dispatch", "volunteerApplication"]),
  states: z.array(z.string().trim().min(1)).default([]),
  transitions: z.array(z.object({ from: z.string().trim().min(1), to: z.string().trim().min(1) })).default([]),
});

const emergencyTypePatchSchema = emergencyTypeCreateSchema.partial();
const severityLevelPatchSchema = severityLevelCreateSchema.partial();
const taskTemplatePatchSchema = taskTemplateCreateSchema.partial();
const workflowPatchSchema = workflowCreateSchema.partial();

function parseCreatePayload(type: MasterDataType, payload: unknown) {
  if (type === "emergency-types") return emergencyTypeCreateSchema.safeParse(payload);
  if (type === "severity-levels") return severityLevelCreateSchema.safeParse(payload);
  if (type === "task-templates") return taskTemplateCreateSchema.safeParse(payload);
  return workflowCreateSchema.safeParse(payload);
}

function parsePatchPayload(type: MasterDataType, payload: unknown) {
  if (type === "emergency-types") return emergencyTypePatchSchema.safeParse(payload);
  if (type === "severity-levels") return severityLevelPatchSchema.safeParse(payload);
  if (type === "task-templates") return taskTemplatePatchSchema.safeParse(payload);
  return workflowPatchSchema.safeParse(payload);
}

router.get(
  "/:type",
  requireAuth,
  requireRole("ADMIN", "LGU"),
  requirePerm("masterdata.view"),
  validate(typeParamSchema, "params"),
  async (req, res) => {
    const type = req.params.type as MasterDataType;
    const items = await listMasterData(type);
    return res.json({ items });
  }
);

router.post(
  "/:type",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("masterdata.edit"),
  validate(typeParamSchema, "params"),
  async (req, res) => {
    const type = req.params.type as MasterDataType;
    const parsed = parseCreatePayload(type, req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
    }

    const payload = parsed.data;
    const created = await createMasterData(type, payload as Record<string, unknown>);

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "MASTERDATA_CREATE",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "MASTER_DATA",
        id: String((created as any)?._id ?? ""),
      },
      metadata: {
        masterDataType: type,
        payload,
      },
    });

    return res.status(201).json({ item: created });
  }
);

router.patch(
  "/:type/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("masterdata.edit"),
  validate(idParamSchema, "params"),
  async (req, res) => {
    const type = req.params.type as MasterDataType;
    const itemId = String(req.params.id);
    const parsed = parsePatchPayload(type, req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
    }

    const payload = parsed.data;
    const updated = await updateMasterData(type, itemId, payload as Record<string, unknown>);

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      action: "MASTERDATA_UPDATE",
      outcome: "SUCCESS",
      actor: {
        id: req.userId,
        role: req.role,
      },
      target: {
        type: "MASTER_DATA",
        id: itemId,
      },
      metadata: {
        masterDataType: type,
        payload,
      },
    });

    return res.json({ item: updated });
  }
);

export default router;
