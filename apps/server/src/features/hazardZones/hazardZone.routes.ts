import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
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
router.post("/", requireAuth, createHazardZone);

// DELETE /api/hazard-zones/:id
router.delete("/:id", requireAuth, deleteHazardZone);

// PATCH /api/hazard-zones/:id/status
router.patch("/:id/status", requireAuth, updateHazardZoneStatus);

export default router;
