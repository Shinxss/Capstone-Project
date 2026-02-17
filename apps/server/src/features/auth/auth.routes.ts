import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { loginLimiter, otpLimiter, passwordLimiter } from "../../middlewares/rateLimit";
import { adminAuthRouter } from "./auth.admin.routes";
import { communityAuthRouter } from "./auth.community.routes";
import { login, logout, me } from "./auth.controller";
import { linkGoogle, loginWithGoogle, setPassword } from "./auth.google.controller";
import { lguAuthRouter } from "./auth.lgu.routes";
import passwordResetRoutes from "./routes/passwordReset.routes";
import signupOtpRoutes from "./routes/signupOtp.routes";

const router = Router();

router.use("/community", communityAuthRouter);
router.use("/lgu", lguAuthRouter);
router.use("/admin", adminAuthRouter);

router.post("/login", loginLimiter, login);
router.post("/google", loginLimiter, loginWithGoogle);
router.post("/set-password", requireAuth, setPassword);
router.post("/link-google", requireAuth, linkGoogle);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.use("/signup", otpLimiter, signupOtpRoutes);
router.use("/password", passwordLimiter, passwordResetRoutes);

export default router;
