import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  getLguTasks,
  getMyActive,
  getMyCompleted,
  getMyCurrent,
  getMyFocusStats,
  getMyPending,
  postReverify,
  postRevoke,
  postVerify,
  patchLocation,
  patchComplete,
  patchRespond,
  patchVerify,
  postDispatchOffers,
  postProof,
} from "./dispatch.controller";
import {
  createDispatchOffersSchema,
  dispatchIdParamsSchema,
  dispatchLocationUpdateSchema,
  listTasksQuerySchema,
  proofSchema,
  reverifySchema,
  revokeSchema,
  respondSchema,
  verifySchema,
} from "./dispatch.validation";

const router = Router();

// LGU/ADMIN creates dispatch offers for selected volunteers
router.post("/", requireAuth, requireRole("LGU", "ADMIN"), validate(createDispatchOffersSchema), postDispatchOffers);

// LGU/ADMIN lists tasks by status
// e.g. GET /api/dispatches?status=ACCEPTED or status=DONE
router.get("/", requireAuth, requireRole("LGU", "ADMIN"), validate(listTasksQuerySchema, "query"), getLguTasks);

// Volunteer polls pending offers
router.get("/my/pending", requireAuth, requireRole("VOLUNTEER"), getMyPending);

// Volunteer gets active accepted dispatch (Map)
router.get("/my/active", requireAuth, requireRole("VOLUNTEER"), getMyActive);

// Volunteer gets current task (ACCEPTED or DONE)
router.get("/my/current", requireAuth, requireRole("VOLUNTEER"), getMyCurrent);

// Volunteer gets verified task history for Tasks "Completed" tab
router.get("/my/completed", requireAuth, requireRole("VOLUNTEER"), getMyCompleted);

// Volunteer gets daily focus stats for Tasks dashboard
router.get("/my/focus-stats", requireAuth, requireRole("VOLUNTEER"), getMyFocusStats);

// Volunteer responds to a pending offer
router.patch("/:id/respond", requireAuth, requireRole("VOLUNTEER"), validate(dispatchIdParamsSchema, "params"), validate(respondSchema), patchRespond);

// Volunteer uploads proof (base64)
router.post("/:id/proof", requireAuth, requireRole("VOLUNTEER"), validate(dispatchIdParamsSchema, "params"), validate(proofSchema), postProof);

// Volunteer marks as done
router.patch("/:id/complete", requireAuth, requireRole("VOLUNTEER"), validate(dispatchIdParamsSchema, "params"), patchComplete);

// Volunteer pushes latest location for community-side live tracking
router.patch(
  "/:id/location",
  requireAuth,
  requireRole("VOLUNTEER"),
  validate(dispatchIdParamsSchema, "params"),
  validate(dispatchLocationUpdateSchema),
  patchLocation
);

// LGU/Admin verifies a done task
router.post("/:id/verify", requireAuth, requireRole("LGU", "ADMIN"), validate(dispatchIdParamsSchema, "params"), validate(verifySchema), postVerify);
router.patch("/:id/verify", requireAuth, requireRole("LGU", "ADMIN"), validate(dispatchIdParamsSchema, "params"), patchVerify);
router.post("/:id/revoke", requireAuth, requireRole("ADMIN"), validate(dispatchIdParamsSchema, "params"), validate(revokeSchema), postRevoke);
router.post("/:id/reverify", requireAuth, requireRole("ADMIN"), validate(dispatchIdParamsSchema, "params"), validate(reverifySchema), postReverify);

export default router;
