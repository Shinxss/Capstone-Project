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

function LifelineLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={
        collapsed
          ? "flex justify-center pt-6 pb-5"
          : "flex items-center gap-3 px-6 pt-6 pb-5"
      }
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
          stroke="#E11D2E"
          strokeWidth="2"
          fill="white"
        />
      </svg>

      {!collapsed && (
        <div className="text-2xl font-bold leading-none">
          <span className="text-[#E11D2E]">Life</span>
          <span className="text-gray-700">line</span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const w = collapsed ? "w-[86px]" : "w-[270px]";

  return (
    <aside
      className={[
        w,
        "bg-white border-r border-gray-300 h-screen shrink-0 flex flex-col",
        "transition-[width] duration-200 ease-in-out",
      ].join(" ")}
    >
      <LifelineLogo collapsed={collapsed} />

      <nav className="px-4 pt-4 flex-1">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    "flex items-center rounded-lg py-3 text-base font-semibold transition-colors",
                    collapsed ? "justify-center px-3" : "gap-4 px-4",
                    isActive
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-800 hover:bg-gray-100",
                  ].join(" ")
                }
              >
                <Icon size={20} className="text-gray-900" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="px-4 pb-6">
        <NavLink
          to="/lgu/settings"
          title={collapsed ? "Settings" : undefined}
          className={({ isActive }) =>
            [
              "flex items-center rounded-lg py-3 text-base font-semibold transition-colors",
              collapsed ? "justify-center px-3" : "gap-4 px-4",
              isActive
                ? "bg-gray-200 text-gray-900"
                : "text-gray-800 hover:bg-gray-100",
            ].join(" ")
          }
        >
          <Settings size={20} className="text-gray-900" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
