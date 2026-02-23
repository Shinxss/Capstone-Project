import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { requireAdminTier } from "../../middlewares/requireAdminTier";
import { requirePerm } from "../../middlewares/requirePerm";
import { exportAuditLogsCsv, getAuditLogByEventId, listAuditLogs } from "./audit.controller";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "LGU"), requirePerm("audit.view"), listAuditLogs);
router.get(
  "/export/csv",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminTier("SUPER"),
  requirePerm("audit.export"),
  exportAuditLogsCsv
);
router.get("/:eventId", requireAuth, requireRole("ADMIN", "LGU"), requirePerm("audit.view"), getAuditLogByEventId);

export default router;
