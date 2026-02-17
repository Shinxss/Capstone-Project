import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import {
  createHazardZone,
  deleteHazardZone,
  listHazardZones,
  updateHazardZoneStatus,
} from "./hazardZone.controller";

const router = Router();

// GET /api/hazard-zones
router.get("/", requireAuth, listHazardZones);

// POST /api/hazard-zones
router.post("/", requireAuth, requireRole("LGU", "ADMIN"), createHazardZone);

// DELETE /api/hazard-zones/:id
router.delete("/:id", requireAuth, requireRole("LGU", "ADMIN"), deleteHazardZone);

// PATCH /api/hazard-zones/:id/status
router.patch("/:id/status", requireAuth, requireRole("LGU", "ADMIN"), updateHazardZoneStatus);

export default router;
