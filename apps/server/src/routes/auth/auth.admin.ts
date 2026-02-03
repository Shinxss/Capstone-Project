import { Router } from "express";
import { adminMfaVerify } from "./auth.controller";

export const adminAuthRouter = Router();

// POST /api/auth/admin/mfa/verify
adminAuthRouter.post("/mfa/verify", adminMfaVerify);
