import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { listVolunteers } from "./user.controller";

const router = Router();

// ✅ LGU/Admin: list volunteers for dispatching
// GET /api/users/volunteers
router.get("/volunteers", requireAuth, requireRole("LGU", "ADMIN"), listVolunteers);

export default router;
