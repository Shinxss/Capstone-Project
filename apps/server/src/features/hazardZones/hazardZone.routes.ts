import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { createHazardZone, listHazardZones } from "./hazardZone.controller";

const router = Router();

// GET /api/hazard-zones
router.get("/", requireAuth, listHazardZones);

// POST /api/hazard-zones
router.post("/", requireAuth, createHazardZone);

export default router;
