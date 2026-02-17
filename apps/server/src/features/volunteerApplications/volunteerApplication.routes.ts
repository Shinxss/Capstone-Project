import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  getMyLatest,
  getVolunteerApplicationById,
  listVolunteerApplications,
  postReview,
  postVolunteerApplication,
} from "./volunteerApplication.controller";

const router = Router();

// Community/Volunteer submits application
router.post("/", requireAuth, requireRole("COMMUNITY", "VOLUNTEER"), postVolunteerApplication);

// User checks latest
router.get("/me/latest", requireAuth, requireRole("COMMUNITY", "VOLUNTEER"), getMyLatest);

// LGU/Admin reviews (verify/reject/needs_info)
router.post("/:id/review", requireAuth, requireRole("LGU", "ADMIN"), postReview);

// LGU/Admin: list applications (for Applicants page)
router.get("/", requireAuth, requireRole("LGU", "ADMIN"), listVolunteerApplications);

// LGU/Admin: view single application
router.get("/:id", requireAuth, requireRole("LGU", "ADMIN"), getVolunteerApplicationById);

export default router;



