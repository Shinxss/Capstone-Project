import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { listVolunteers } from "./user.controller";

const router = Router();

// ✅ LGU/Admin: list volunteers for dispatching
// GET /api/users/volunteers
router.get("/volunteers", requireAuth, listVolunteers);

export default router;
