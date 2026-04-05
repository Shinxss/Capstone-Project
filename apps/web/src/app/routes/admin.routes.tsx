import { Navigate, Route } from "react-router-dom";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminLiveMap from "@/pages/admin/AdminLiveMap";
import AdminEmergencyReports from "@/pages/admin/AdminEmergencyReports";
import AdminTasks from "@/pages/admin/AdminTasks";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminAuditTrails from "@/pages/admin/AdminAuditTrails";
import AdminProfile from "@/pages/admin/AdminProfile";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUserManagement from "@/pages/admin/AdminUserManagement";
import AdminBarangaysCoverage from "@/pages/admin/AdminBarangaysCoverage";
import AdminRolesPermissions from "@/pages/admin/AdminRolesPermissions";
import AdminMasterData from "@/pages/admin/AdminMasterData";
import { RequireAdminAuth } from "./guards";

export function renderAdminRoutes() {
  return (
    <Route element={<RequireAdminAuth />}>
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />
      <Route path="/admin/live-map" element={<AdminLiveMap />} />
      <Route path="/admin/emergency-reports" element={<AdminEmergencyReports />} />
      <Route path="/admin/tasks" element={<AdminTasks />} />
      <Route path="/admin/announcements" element={<AdminAnnouncements />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/audit-trails" element={<AdminAuditTrails />} />
      <Route path="/admin/profile" element={<AdminProfile />} />
      <Route path="/admin/settings" element={<AdminSettings />} />

      <Route path="/admin/console/users" element={<AdminUserManagement />} />
      <Route path="/admin/console/barangays" element={<AdminBarangaysCoverage />} />
      <Route path="/admin/console/roles" element={<AdminRolesPermissions />} />
      <Route path="/admin/console/master-data" element={<AdminMasterData />} />
    </Route>
  );
}
