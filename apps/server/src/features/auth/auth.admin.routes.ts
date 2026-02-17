import { Router } from "express";
import { otpLimiter } from "../../middlewares/rateLimit";
import { adminMfaVerify } from "./auth.controller";

export const adminAuthRouter = Router();

adminAuthRouter.post("/mfa/verify", otpLimiter, adminMfaVerify);
