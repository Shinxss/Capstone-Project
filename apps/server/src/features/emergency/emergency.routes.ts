import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { postSos, listReports } from "./emergency.controller";
import { listReportsQuerySchema, sosSchema } from "./emergency.validation";

const router = Router();

// POST /api/emergencies/sos
router.post(
  "/sos",
  requireAuth,
  requireRole("COMMUNITY", "VOLUNTEER", "LGU", "ADMIN"),
  validate(sosSchema),
  postSos
);

// ✅ GET /api/emergencies/reports
router.get("/reports", requireAuth, requireRole("LGU", "ADMIN"), validate(listReportsQuerySchema, "query"), listReports);

export default router;
