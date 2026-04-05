import { Navigate, Route } from "react-router-dom";
import PlaceholderPage from "@/pages/lgu/PlaceholderPage";
import LguDashboard from "@/pages/lgu/LguDashboard";
import LguNotifications from "@/pages/lgu/LguNotifications";
import LguEmergencies from "@/pages/lgu/LguEmergencies";
import LguLiveMap from "@/pages/lgu/LguLiveMap";
import LguApplicants from "@/pages/lgu/LguApplicants";
import LguVerifiedVolunteers from "@/pages/lgu/LguVerifiedVolunteers";
import LguResponderAccounts from "@/pages/lgu/LguResponderAccounts";
import LguResponderTeams from "@/pages/lgu/LguResponderTeams";
import LguTasksInProgress from "@/pages/lgu/tasks/LguTasksInProgress";
import LguTasksForReview from "@/pages/lgu/tasks/LguTasksForReview";
import LguTasksCompleted from "@/pages/lgu/tasks/LguTasksCompleted";
import LguTasksCanceled from "@/pages/lgu/tasks/LguTasksCanceled";
import LguApprovals from "@/pages/lgu/LguApprovals";
import LguActivityLog from "@/pages/lgu/LguActivityLog";
import LguAnnouncements from "@/pages/lgu/LguAnnouncements";
import LguReports from "@/pages/lgu/LguReports";
import LguProfile from "@/pages/lgu/LguProfile";
import LguSettings from "@/pages/lgu/LguSettings";
import LguNotificationSettings from "@/pages/lgu/LguNotificationSettings";
import LguPrivacyPolicy from "@/pages/lgu/LguPrivacyPolicy";
import { RequireLguAuth } from "./guards";

export function renderLguRoutes() {
  return (
    <Route element={<RequireLguAuth />}>
      <Route path="/lgu/dashboard" element={<LguDashboard />} />
      <Route path="/lgu/notifications" element={<LguNotifications />} />
      <Route path="/lgu/emergencies" element={<LguEmergencies />} />

      <Route path="/lgu/responders" element={<Navigate to="/lgu/responders/accounts" replace />} />
      <Route path="/lgu/responders/accounts" element={<LguResponderAccounts />} />
      <Route path="/lgu/responders/teams" element={<LguResponderTeams />} />

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
      <Route path="/lgu/notification-settings" element={<LguNotificationSettings />} />
      <Route path="/lgu/help" element={<PlaceholderPage title="Help" subtitle="Guides and support resources" />} />
      <Route path="/lgu/privacy" element={<LguPrivacyPolicy />} />
    </Route>
  );
}
