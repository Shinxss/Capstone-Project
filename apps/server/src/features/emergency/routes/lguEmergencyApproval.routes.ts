import { Router } from "express";
import { requireAuth } from "../../../middlewares/requireAuth";
import { requireRole } from "../../../middlewares/requireRole";
import { validate } from "../../../middlewares/validate";
import {
  approvalsStatusQuerySchema,
  emergencyReportIdParamSchema,
  rejectEmergencyReportSchema,
} from "../schemas/emergencyReport.schema";
import {
  approveEmergencyReportController,
  listPendingEmergencyApprovalsController,
  rejectEmergencyReportController,
} from "../controllers/emergencyReport.controller";

const router = Router();

router.use(requireAuth, requireRole("LGU", "ADMIN"));

router.get("/", validate(approvalsStatusQuerySchema, "query"), listPendingEmergencyApprovalsController);
router.patch("/:id/approve", validate(emergencyReportIdParamSchema, "params"), approveEmergencyReportController);
router.patch(
  "/:id/reject",
  validate(emergencyReportIdParamSchema, "params"),
  validate(rejectEmergencyReportSchema),
  rejectEmergencyReportController
);

export default router;
