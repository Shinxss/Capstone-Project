import { Routes, Route, Navigate } from "react-router-dom";
import LguLogin from "./pages/lgu/LguLogin";
import LguDashboard from "./pages/lgu/LguDashboard";
import PlaceholderPage from "./pages/lgu/PlaceholderPage";
import LguEmergencies from "./pages/lgu/LguEmergencies";

export default function App() {
  return (
    <Routes>
      <Route path="/lgu/login" element={<LguLogin />} />

      {/* ✅ Dashboard (same UI as screenshot) */}
      <Route path="/lgu/dashboard" element={<LguDashboard />} />

      {/* ✅ Placeholder pages for sidebar routes (for now) */}
      <Route path="/lgu/emergencies" element={<LguEmergencies />} />
      <Route path="/lgu/volunteers" element={<PlaceholderPage title="Volunteers" />} />
      <Route path="/lgu/tasks" element={<PlaceholderPage title="Tasks" />} />
      <Route path="/lgu/live-map" element={<PlaceholderPage title="Live Map" />} />
      <Route path="/lgu/blockchain-logs" element={<PlaceholderPage title="Blockchain Logs" />} />
      <Route path="/lgu/reports" element={<PlaceholderPage title="Reports" />} />
      <Route path="/lgu/profile" element={<PlaceholderPage title="Profile" />} />
      <Route path="/lgu/settings" element={<PlaceholderPage title="Settings" />} />

      <Route path="*" element={<Navigate to="/lgu/login" replace />} />
    </Routes>
  );
}
