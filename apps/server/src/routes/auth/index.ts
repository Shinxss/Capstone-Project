import { Router } from "express";
import { communityAuthRouter } from "./auth.community";
import { lguAuthRouter } from "./auth.lgu";
import { adminAuthRouter } from "./auth.admin";
import { login, me } from "./auth.controller";
import { requireAuth } from "../../middlewares/requireAuth";

const router = Router();

// Login Community & LGU (and ADMIN via LGU login)
router.use("/community", communityAuthRouter);
router.use("/lgu", lguAuthRouter);

// ✅ Admin MFA
router.use("/admin", adminAuthRouter);

// Name Fetching Community
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
