import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { getAuditLogByEventId, listAuditLogs } from "./audit.controller";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "LGU"), listAuditLogs);
router.get("/:eventId", requireAuth, requireRole("ADMIN", "LGU"), getAuditLogByEventId);

export default router;
