import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import emergencyRoutes from "./emergency/emergency.routes";
import volunteerApplicationRoutes from "./volunteerApplications/volunteerApplication.routes";

const router = Router();

// feature routes
router.use("/auth", authRoutes); //Login
router.use("/emergencies", emergencyRoutes); // Emergencies
router.use("/volunteer-applications", volunteerApplicationRoutes); // Volunteer Applications

export default router;
