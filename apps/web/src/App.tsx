import { Routes, Route, Navigate } from "react-router-dom";
import LguLogin from "./pages/Login";
import LguDashboard from "./pages/lgu/LguDashboard";
import PlaceholderPage from "./pages/lgu/PlaceholderPage";
import LguEmergencies from "./pages/lgu/LguEmergencies";
import LguLiveMap from "./pages/lgu/LguLiveMap";
import LguApplicants from "./pages/lgu/LguApplicants";
import LguVerifiedVolunteers from "./pages/lgu/LguVerifiedVolunteers";

export default function App() {
  return (
    <Routes>
      <Route path="/lgu/login" element={<LguLogin />} />

      <Route path="/lgu/dashboard" element={<LguDashboard />} />

      <Route path="/lgu/notifications" element={<PlaceholderPage title="Notifications" />} />

      <Route path="/lgu/emergencies" element={<LguEmergencies />} />

      {/* ✅ Volunteers */}
      <Route path="/lgu/volunteers" element={<PlaceholderPage title="Volunteers" />} />
      <Route path="/lgu/volunteers/applicants" element={<LguApplicants />} />
      <Route path="/lgu/volunteers/verified" element={<LguVerifiedVolunteers />} />


      <Route path="/lgu/tasks" element={<PlaceholderPage title="Tasks" />} />

      <Route path="/lgu/live-map" element={<LguLiveMap />} />

      <Route path="/lgu/announcements" element={<PlaceholderPage title="Announcements" />} />
      <Route path="/lgu/reports" element={<PlaceholderPage title="Reports" />} />

      <Route path="/lgu/profile" element={<PlaceholderPage title="Profile" />} />
      <Route path="/lgu/settings" element={<PlaceholderPage title="Settings" />} />

      <Route path="*" element={<Navigate to="/lgu/login" replace />} />
    </Routes>
  );
}
