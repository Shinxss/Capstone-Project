import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import LguLogin from "./pages/Login";

import LguDashboard from "./pages/lgu/LguDashboard";
import LguNotifications from "./pages/lgu/LguNotifications";
import LguEmergencies from "./pages/lgu/LguEmergencies";
import LguLiveMap from "./pages/lgu/LguLiveMap";
import PlaceholderPage from "./pages/lgu/PlaceholderPage";
import LguApplicants from "./pages/lgu/LguApplicants";
import LguVerifiedVolunteers from "./pages/lgu/LguVerifiedVolunteers";
import LguTasksInProgress from "./pages/lgu/tasks/LguTasksInProgress";
import LguTasksForReview from "./pages/lgu/tasks/LguTasksForReview";
import LguTasksCompleted from "./pages/lgu/tasks/LguTasksCompleted";
import LguTasksCanceled from "./pages/lgu/tasks/LguTasksCanceled";
import LguApprovals from "./pages/lgu/LguApprovals";
import LguActivityLog from "./pages/lgu/LguActivityLog";
import LguAnnouncements from "./pages/lgu/LguAnnouncements";
import LguReports from "./pages/lgu/LguReports";
import LguProfile from "./pages/lgu/LguProfile";
import LguSettings from "./pages/lgu/LguSettings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminLiveMap from "./pages/admin/AdminLiveMap";
import AdminEmergencyReports from "./pages/admin/AdminEmergencyReports";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAuditTrails from "./pages/admin/AdminAuditTrails";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminBarangaysCoverage from "./pages/admin/AdminBarangaysCoverage";
import AdminRolesPermissions from "./pages/admin/AdminRolesPermissions";
import AdminMasterData from "./pages/admin/AdminMasterData";

import { getLguToken, getLguUser } from "./features/auth/services/authStorage";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialogProvider } from "@/features/feedback/context/confirm.context";

function RequireLguAuth() {
  const token = getLguToken();

  if (!token) {
    return <Navigate to="/lgu/login" replace />;
  }

  return <Outlet />;
}

function RequireAdminAuth() {
  const token = getLguToken();
  const user = getLguUser();

  if (!token || user?.role !== "ADMIN") {
    return <Navigate to="/lgu/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <ConfirmDialogProvider>
      <Toaster />
      <Routes>
        <Route path="/lgu/login" element={<LguLogin />} />

        <Route element={<RequireLguAuth />}>
          <Route path="/lgu/dashboard" element={<LguDashboard />} />
          <Route path="/lgu/notifications" element={<LguNotifications />} />
          <Route path="/lgu/emergencies" element={<LguEmergencies />} />

          <Route path="/lgu/volunteers" element={<PlaceholderPage title="Volunteers" />} />
          <Route path="/lgu/volunteers/applicants" element={<LguApplicants />} />
          <Route path="/lgu/volunteers/verified" element={<LguVerifiedVolunteers />} />

          <Route path="/lgu/tasks" element={<Navigate to="/lgu/tasks/in-progress" replace />} />
          <Route path="/lgu/tasks/in-progress" element={<LguTasksInProgress />} />
          <Route path="/lgu/tasks/for-review" element={<LguTasksForReview />} />
          <Route path="/lgu/tasks/completed" element={<LguTasksCompleted />} />
          <Route path="/lgu/tasks/canceled" element={<LguTasksCanceled />} />
          <Route path="/lgu/tasks/archived" element={<Navigate to="/lgu/tasks/canceled" replace />} />

          <Route path="/lgu/approvals" element={<LguApprovals />} />

          <Route path="/lgu/audit-log" element={<LguActivityLog />} />
          <Route path="/lgu/activity-log" element={<Navigate to="/lgu/audit-log" replace />} />

          <Route path="/lgu/live-map" element={<LguLiveMap />} />

          <Route path="/lgu/announcements" element={<LguAnnouncements />} />
          <Route path="/lgu/reports" element={<LguReports />} />

          <Route path="/lgu/profile" element={<LguProfile />} />
          <Route path="/lgu/settings" element={<LguSettings />} />
        </Route>

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

        <Route path="*" element={<Navigate to="/lgu/login" replace />} />
      </Routes>
    </ConfirmDialogProvider>
  );
}
