import { Router } from "express";
import { validate } from "../../../middlewares/validate";
import { maybeAuth } from "../../../middlewares/maybeAuth";
import { requireAuth } from "../../../middlewares/requireAuth";
import { guestEmergencyPhotoLimiter, guestEmergencyReportLimiter } from "../../../middlewares/rateLimit";
import {
  createEmergencyReportSchema,
  emergencyReportIdParamSchema,
  myEmergencyReportsQuerySchema,
  referenceNumberParamSchema,
  uploadEmergencyReportPhotoSchema,
} from "../schemas/emergencyReport.schema";
import {
  getMyActiveEmergencyReportController,
  getMyEmergencyReportCountsController,
  getMyEmergencyReportsMapFeed,
  getMyEmergencyTrackingController,
  patchMyEmergencyReportCancelController,
  getEmergencyReportsMapFeed,
  getEmergencyReportByReferenceNumber,
  getEmergencyReportDetail,
  listMyEmergencyReportsController,
  postEmergencyReport,
  postEmergencyReportPhoto,
} from "../controllers/emergencyReport.controller";

const router = Router();

router.post("/", guestEmergencyReportLimiter, maybeAuth, validate(createEmergencyReportSchema), postEmergencyReport);
router.post(
  "/photos",
  guestEmergencyPhotoLimiter,
  maybeAuth,
  validate(uploadEmergencyReportPhotoSchema),
  postEmergencyReportPhoto
);
router.get("/my/active", requireAuth, getMyActiveEmergencyReportController);
router.get("/my", requireAuth, validate(myEmergencyReportsQuerySchema, "query"), listMyEmergencyReportsController);
router.get("/my/counts", requireAuth, getMyEmergencyReportCountsController);
router.get("/my/map", requireAuth, getMyEmergencyReportsMapFeed);
router.patch(
  "/my/:id/cancel",
  requireAuth,
  validate(emergencyReportIdParamSchema, "params"),
  patchMyEmergencyReportCancelController
);
router.get("/my/:id/tracking", requireAuth, validate(emergencyReportIdParamSchema, "params"), getMyEmergencyTrackingController);
router.get("/map", getEmergencyReportsMapFeed);
router.get("/ref/:referenceNumber", validate(referenceNumberParamSchema, "params"), getEmergencyReportByReferenceNumber);
router.get("/:id", maybeAuth, validate(emergencyReportIdParamSchema, "params"), getEmergencyReportDetail);

export default router;
