import { Router } from "express";
import { validate } from "../../../middlewares/validate";
import { maybeAuth } from "../../../middlewares/maybeAuth";
import { guestEmergencyReportLimiter } from "../../../middlewares/rateLimit";
import {
  createEmergencyReportSchema,
  emergencyReportIdParamSchema,
  referenceNumberParamSchema,
} from "../schemas/emergencyReport.schema";
import {
  getEmergencyReportsMapFeed,
  getEmergencyReportByReferenceNumber,
  getEmergencyReportDetail,
  postEmergencyReport,
} from "../controllers/emergencyReport.controller";

const router = Router();

router.post("/", guestEmergencyReportLimiter, maybeAuth, validate(createEmergencyReportSchema), postEmergencyReport);
router.get("/map", getEmergencyReportsMapFeed);
router.get("/ref/:referenceNumber", validate(referenceNumberParamSchema, "params"), getEmergencyReportByReferenceNumber);
router.get("/:id", maybeAuth, validate(emergencyReportIdParamSchema, "params"), getEmergencyReportDetail);

export default router;
