import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  getLguTasks,
  getMyActive,
  getMyCurrent,
  getMyPending,
  patchComplete,
  patchRespond,
  patchVerify,
  postDispatchOffers,
  postProof,
} from "./dispatch.controller";
import {
  createDispatchOffersSchema,
  dispatchIdParamsSchema,
  listTasksQuerySchema,
  proofSchema,
  respondSchema,
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

// Volunteer responds to a pending offer
router.patch("/:id/respond", requireAuth, requireRole("VOLUNTEER"), validate(dispatchIdParamsSchema, "params"), validate(respondSchema), patchRespond);

// Volunteer uploads proof (base64)
router.post("/:id/proof", requireAuth, requireRole("VOLUNTEER"), validate(dispatchIdParamsSchema, "params"), validate(proofSchema), postProof);

// Volunteer marks as done
router.patch("/:id/complete", requireAuth, requireRole("VOLUNTEER"), validate(dispatchIdParamsSchema, "params"), patchComplete);

// LGU/Admin verifies a done task
router.patch("/:id/verify", requireAuth, requireRole("LGU", "ADMIN"), validate(dispatchIdParamsSchema, "params"), patchVerify);

export default router;
