import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  ClipboardList,
  Map as MapIcon,
  Link2,
  FileText,
  User,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/lgu/dashboard", icon: LayoutDashboard },
  { label: "Emergencies", to: "/lgu/emergencies", icon: AlertTriangle },
  { label: "Volunteers", to: "/lgu/volunteers", icon: Users },
  { label: "Tasks", to: "/lgu/tasks", icon: ClipboardList },
  { label: "Live Map", to: "/lgu/live-map", icon: MapIcon },
  { label: "Blockchain Logs", to: "/lgu/blockchain-logs", icon: Link2 },
  { label: "Reports", to: "/lgu/reports", icon: FileText },
  { label: "Profile", to: "/lgu/profile", icon: User },
];

function LifelineLogo() {
  return (
    <div className="flex items-center gap-3 px-6 pt-6 pb-5">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
          stroke="#E11D2E"
          strokeWidth="2"
          fill="white"
        />
      </svg>
      <div className="text-2xl font-bold leading-none">
        <span className="text-[#E11D2E]">Life</span>
        <span className="text-gray-700">line</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="
        w-[270px]
        bg-white
        border-r border-gray-300
        min-h-screen
        flex flex-col
      "
    >
      <LifelineLogo />

      {/* ✅ Fixed menu area (no scrolling) */}
      <nav className="px-4 pt-4 flex-1">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-semibold",
                    "transition-colors",
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-800 hover:bg-gray-100",
                  ].join(" ")
                }
              >
                <Icon size={20} className="text-gray-900" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ✅ Settings pinned bottom */}
      <div className="px-4 pb-6">
        <NavLink
          to="/lgu/settings"
          className={({ isActive }) =>
            [
              "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-semibold",
              "transition-colors",
              isActive
                ? "bg-gray-200 text-gray-900"
                : "text-gray-800 hover:bg-gray-100",
            ].join(" ")
          }
        >
          <Settings size={20} className="text-gray-900" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
