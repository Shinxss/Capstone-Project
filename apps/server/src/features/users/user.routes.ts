import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  deleteMyAvatar,
  getMyProfileSummary,
  listVolunteers,
  uploadMyAvatar,
} from "./user.controller";

const router = Router();

router.get("/me/profile-summary", requireAuth, getMyProfileSummary);
router.post("/me/avatar", requireAuth, uploadMyAvatar);
router.delete("/me/avatar", requireAuth, deleteMyAvatar);

// LGU/Admin: list volunteers for dispatching
// GET /api/users/volunteers
router.get("/volunteers", requireAuth, requireRole("LGU", "ADMIN"), listVolunteers);

export default router;
