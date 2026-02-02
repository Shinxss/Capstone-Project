import { Router } from "express";
import { communityAuthRouter } from "./auth.community";
import { lguAuthRouter } from "./auth.lgu";
import { login, me } from "./auth.controller";
import { requireAuth } from "../../middlewares/requireAuth";

const router = Router();


//Login Community & LGU
router.use("/community", communityAuthRouter);
router.use("/lgu", lguAuthRouter);

//Name Fetching Community
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
