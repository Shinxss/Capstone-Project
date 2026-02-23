import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { predict } from "./routingRisk.controller";

const router = Router();

// POST /api/routing-risk/predict
router.post("/predict", requireAuth, predict);

export default router;