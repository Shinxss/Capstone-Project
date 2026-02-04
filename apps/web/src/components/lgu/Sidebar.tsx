import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  ClipboardList,
  Map as MapIcon,
  FileText,
  User,
  Settings,
  Bell,
  Megaphone,
  ClipboardCheck,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", to: "/lgu/dashboard", icon: LayoutDashboard },
      { label: "Notifications", to: "/lgu/notifications", icon: Bell },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Emergencies", to: "/lgu/emergencies", icon: AlertTriangle },
      { label: "Volunteers", to: "/lgu/volunteers", icon: Users },
      { label: "Tasks", to: "/lgu/tasks", icon: ClipboardList },
      {
        label: "Approvals / Verification",
        to: "/lgu/approvals",
        icon: ClipboardCheck,
      },
      { label: "Live Map", to: "/lgu/live-map", icon: MapIcon },
    ],
  },
  {
    title: "Updates",
    items: [
      { label: "Announcements", to: "/lgu/announcements", icon: Megaphone },
      { label: "Reports", to: "/lgu/reports", icon: FileText },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Profile", to: "/lgu/profile", icon: User }],
  },
];

function LifelineLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={
        collapsed
          ? "flex justify-center pt-5 pb-4"
          : "flex items-center gap-2.5 px-5 pt-5 pb-4"
      }
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
          stroke="#E11D2E"
          strokeWidth="2"
          fill="white"
        />
      </svg>

      {!collapsed && (
        <div className="text-xl font-bold leading-none">
          <span className="text-[#E11D2E]">Life</span>
          <span className="text-gray-700">line</span>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "flex items-center rounded-md transition-colors",
          "py-2 text-sm font-medium", // ✅ smaller
          collapsed ? "justify-center px-2.5" : "gap-3 px-3", // ✅ tighter
          isActive ? "bg-gray-200 text-gray-900" : "text-gray-800 hover:bg-gray-100",
        ].join(" ")
      }
    >
      <Icon size={18} className="text-gray-900" /> {/* ✅ smaller icon */}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const w = collapsed ? "w-[78px]" : "w-[255px]"; // ✅ slightly smaller

  return (
    <aside
      className={[
        w,
        "bg-white border-r border-gray-300 h-screen shrink-0 flex flex-col",
        "transition-[width] duration-200 ease-in-out",
      ].join(" ")}
    >
      <LifelineLogo collapsed={collapsed} />

      <nav className="px-3 pt-1 flex-1 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.title} className={idx === 0 ? "" : "mt-3"}>
            {/* ✅ separator smaller spacing */}
            {idx !== 0 && (
              <div className={collapsed ? "my-2.5" : "my-3"}>
                <div className="h-px bg-gray-200" />
              </div>
            )}

            {/* ✅ section title smaller */}
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                {section.title}
              </div>
            )}

            <div className="space-y-1.5">
              {section.items.map((item) => (
                <SidebarItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <div className={collapsed ? "my-2.5" : "my-3"}>
          <div className="h-px bg-gray-200" />
        </div>

        <NavLink
          to="/lgu/settings"
          title={collapsed ? "Settings" : undefined}
          className={({ isActive }) =>
            [
              "flex items-center rounded-md transition-colors",
              "py-2 text-sm font-medium",
              collapsed ? "justify-center px-2.5" : "gap-3 px-3",
              isActive ? "bg-gray-200 text-gray-900" : "text-gray-800 hover:bg-gray-100",
            ].join(" ")
          }
        >
          <Settings size={18} className="text-gray-900" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
