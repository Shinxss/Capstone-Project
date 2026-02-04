import { Routes, Route, Navigate } from "react-router-dom";
import LguLogin from "./pages/Login";
import LguDashboard from "./pages/lgu/LguDashboard";
import PlaceholderPage from "./pages/lgu/PlaceholderPage";
import LguEmergencies from "./pages/lgu/LguEmergencies";
import LguLiveMap from "./pages/lgu/LguLiveMap";

export default function App() {
  return (
    <Routes>
      <Route path="/lgu/login" element={<LguLogin />} />

      {/* ✅ Dashboard */}
      <Route path="/lgu/dashboard" element={<LguDashboard />} />

      {/* ✅ Sidebar routes */}
      <Route path="/lgu/notifications" element={<PlaceholderPage title="Notifications" />} />

      <Route path="/lgu/emergencies" element={<LguEmergencies />} />
      <Route path="/lgu/volunteers" element={<PlaceholderPage title="Volunteers" />} />
      <Route path="/lgu/tasks" element={<PlaceholderPage title="Tasks" />} />
      <Route path="/lgu/approvals" element={<PlaceholderPage title="Approvals / Verification" />} />

      {/* Risk Zones stays inside Live Map */}
      <Route path="/lgu/live-map" element={<LguLiveMap />} />

      <Route path="/lgu/announcements" element={<PlaceholderPage title="Announcements" />} />
      <Route path="/lgu/reports" element={<PlaceholderPage title="Reports" />} />

      <Route path="/lgu/profile" element={<PlaceholderPage title="Profile" />} />
      <Route path="/lgu/settings" element={<PlaceholderPage title="Settings" />} />

      {/* ✅ Default */}
      <Route path="*" element={<Navigate to="/lgu/login" replace />} />
    </Routes>
  );
}
