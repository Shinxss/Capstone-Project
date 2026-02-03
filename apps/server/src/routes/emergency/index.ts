import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { postSos } from "./emergency.controller";

const router = Router();

// POST /api/emergencies/sos
router.post("/sos", requireAuth, postSos);

export default router;
