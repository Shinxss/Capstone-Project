import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { dispatchToVolunteers, getMyPendingDispatch, respondToMyDispatch } from "./dispatch.controller";

const router = Router();

// LGU/ADMIN: dispatch emergency to selected volunteers
router.post("/", requireAuth, dispatchToVolunteers);

// Volunteer: fetch latest pending dispatch offer
router.get("/my/pending", requireAuth, getMyPendingDispatch);

// Volunteer: accept/decline offer
router.patch("/:id/respond", requireAuth, respondToMyDispatch);

export default router;
