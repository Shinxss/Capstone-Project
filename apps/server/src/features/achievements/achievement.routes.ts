import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { getMyAchievementsController } from "./achievement.controller";

const router = Router();

router.get("/me", requireAuth, getMyAchievementsController);

export default router;
