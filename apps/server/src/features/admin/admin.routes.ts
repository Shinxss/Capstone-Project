import { Router } from "express";
import rbacRoutes from "../rbac/rbac.routes";
import masterDataRoutes from "../masterData/masterData.routes";
import analyticsRoutes from "../analytics/analytics.routes";
import { adminAnnouncementsRouter } from "../announcements/announcements.routes";
import { adminUsersRouter } from "./adminUsers.routes";
import { adminBarangaysRouter } from "./adminBarangays.routes";

const router = Router();

router.use("/users", adminUsersRouter);
router.use("/barangays", adminBarangaysRouter);
router.use("/rbac", rbacRoutes);
router.use("/masterdata", masterDataRoutes);
router.use("/announcements", adminAnnouncementsRouter);
router.use("/analytics", analyticsRoutes);

export default router;
