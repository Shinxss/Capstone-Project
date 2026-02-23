import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import emergencyRoutes from "./emergency/emergency.routes";
import volunteerApplicationRoutes from "./volunteerApplications/volunteerApplication.routes";
import hazardZoneRoutes from "./hazardZones/hazardZone.routes";
import userRoutes from "./users/user.routes";
import dispatchRoutes from "./dispatches/dispatch.routes";
import securityRoutes from "./security/security.routes";
import auditRoutes from "./audit/audit.routes";
import emergencyReportRoutes from "./emergency/routes/emergencyReport.routes";
import lguEmergencyApprovalRoutes from "./emergency/routes/lguEmergencyApproval.routes";
import notificationsRoutes from "./notifications/notifications.routes";
import adminRoutes from "./admin/admin.routes";
import announcementsRoutes from "./announcements/announcements.routes";
import routingRiskRoutes from "./routingRisk/routingRisk.routes";
import routingRoutes from "./routing/routing.routes";
import weatherRoutes from "./weather/weather.routes";
const router = Router();

// feature routes
router.use("/security", securityRoutes); // CSRF token endpoint
router.use("/auth", authRoutes); //Login
router.use("/emergencies", emergencyRoutes); // Emergencies
router.use("/volunteer-applications", volunteerApplicationRoutes); // Volunteer Applications
router.use("/hazard-zones", hazardZoneRoutes); // Hazard Zones
router.use("/users", userRoutes); // Users
router.use("/dispatches", dispatchRoutes); // Dispatch Offers
router.use("/audit", auditRoutes); // Audit Logs
router.use("/emergency/reports", emergencyReportRoutes);
router.use("/lgu/approvals/emergency-reports", lguEmergencyApprovalRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/admin", adminRoutes);
router.use("/announcements", announcementsRoutes);
router.use("/routing-risk", routingRiskRoutes);
router.use("/routing", routingRoutes);
router.use("/weather", weatherRoutes);

export default router;
