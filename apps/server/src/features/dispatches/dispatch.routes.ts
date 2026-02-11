import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
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

const router = Router();

// LGU/ADMIN creates dispatch offers for selected volunteers
router.post("/", requireAuth, postDispatchOffers);

// LGU/ADMIN lists tasks by status
// e.g. GET /api/dispatches?status=ACCEPTED or status=DONE
router.get("/", requireAuth, getLguTasks);

// Volunteer polls pending offers
router.get("/my/pending", requireAuth, getMyPending);

// Volunteer gets active accepted dispatch (Map)
router.get("/my/active", requireAuth, getMyActive);

// Volunteer gets current task (ACCEPTED or DONE)
router.get("/my/current", requireAuth, getMyCurrent);

// Volunteer responds to a pending offer
router.patch("/:id/respond", requireAuth, patchRespond);

// Volunteer uploads proof (base64)
router.post("/:id/proof", requireAuth, postProof);

// Volunteer marks as done
router.patch("/:id/complete", requireAuth, patchComplete);

// LGU verifies a done task
router.patch("/:id/verify", requireAuth, patchVerify);

export default router;
