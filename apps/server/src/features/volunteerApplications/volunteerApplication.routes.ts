import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import {
  getMyLatest,
  getVolunteerApplicationById,
  listVolunteerApplications,
  postReview,
  postVolunteerApplication,
} from "./volunteerApplication.controller";

const router = Router();

// Community/Volunteer submits application
router.post("/", requireAuth, postVolunteerApplication);

// User checks latest
router.get("/me/latest", requireAuth, getMyLatest);

// LGU/Admin reviews (verify/reject/needs_info)
router.post("/:id/review", requireAuth, postReview);

// LGU/Admin: list applications (for Applicants page)
router.get("/", requireAuth, listVolunteerApplications);

// LGU/Admin: view single application
router.get("/:id", requireAuth, getVolunteerApplicationById);

export default router;



