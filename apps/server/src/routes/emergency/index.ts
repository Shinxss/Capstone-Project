import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { postSos, listReports } from "./emergency.controller";

const router = Router();

// POST /api/emergencies/sos
router.post("/sos", requireAuth, postSos);

// ✅ GET /api/emergencies/reports
router.get("/reports", requireAuth, listReports);

export default router;
