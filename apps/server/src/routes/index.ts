import { Router } from "express";
import authRoutes from "./auth";
import emergencyRoutes from "./emergency";
const router = Router();


// feature routes
router.use("/auth", authRoutes);
router.use("/emergencies", emergencyRoutes);


export default router;
