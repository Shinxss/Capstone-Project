import { Router } from "express";
import { routingOptimizeLimiter } from "../../middlewares/rateLimit";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { postOptimizeRoute } from "./routing.controller";
import { optimizeRouteSchema } from "./routing.validation";

const router = Router();

// POST /api/routing/optimize
router.post(
  "/optimize",
  routingOptimizeLimiter,
  requireAuth,
  requireRole("COMMUNITY", "VOLUNTEER", "LGU", "ADMIN"),
  validate(optimizeRouteSchema),
  postOptimizeRoute
);

export default router;
