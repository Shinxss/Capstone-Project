import { Router } from "express";
import { communityAuthRouter } from "./auth.community.routes";
import { lguAuthRouter } from "./auth.lgu.routes";
import { adminAuthRouter } from "./auth.admin.routes";
import { login, me } from "./auth.controller";
import { linkGoogle, loginWithGoogle, setPassword } from "./auth.google.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import signupOtpRoutes from "./routes/signupOtp.routes";
import passwordResetRoutes from "./routes/passwordReset.routes";

const router = Router();

// Login Community & LGU (and ADMIN via LGU login)
router.use("/community", communityAuthRouter);
router.use("/lgu", lguAuthRouter);

// ✅ Admin MFA
router.use("/admin", adminAuthRouter);

// Name Fetching Community
router.post("/login", login);
router.post("/google", loginWithGoogle);
router.post("/set-password", requireAuth, setPassword);
router.post("/link-google", requireAuth, linkGoogle);
router.get("/me", requireAuth, me);
router.use("/signup", signupOtpRoutes);
router.use("/password", passwordResetRoutes);

export default router;
