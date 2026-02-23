import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { getWeatherSummaryController } from "./weather.controller";
import { weatherSummaryQuerySchema } from "./weather.validation";

const router = Router();

// GET /api/weather/summary?lat=..&lng=..
router.get(
  "/summary",
  requireAuth,
  validate(weatherSummaryQuerySchema, "query"),
  getWeatherSummaryController
);

export default router;
