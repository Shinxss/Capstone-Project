import { NavLink } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  Map,
  Megaphone,
  BarChart3,
  ShieldCheck,
  User,
  Settings,
  Users,
  MapPinned,
  KeyRound,
  Database,
  FileWarning,
} from "lucide-react";
import { LifelineLogo } from "../LifelineLogo";
import { useThemeMode } from "../../features/theme/hooks/useThemeMode";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  superOnly?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Notifications", to: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Live Map / Dispatch", to: "/admin/live-map", icon: Map },
      { label: "Emergency Reports", to: "/admin/emergency-reports", icon: FileWarning },
      { label: "Tasks & Assignments", to: "/admin/tasks", icon: ClipboardList },
    ],
  },
  {
    title: "Admin Console",
    items: [
      { label: "User Management", to: "/admin/console/users", icon: Users, superOnly: true },
      { label: "Barangays & Coverage", to: "/admin/console/barangays", icon: MapPinned, superOnly: true },
      { label: "Roles & Permissions", to: "/admin/console/roles", icon: KeyRound, superOnly: true },
      { label: "Master Data", to: "/admin/console/master-data", icon: Database, superOnly: true },
    ],
  },
  {
    title: "Updates",
    items: [
      { label: "Announcements", to: "/admin/announcements", icon: Megaphone },
      { label: "Analytics & Reports", to: "/admin/analytics", icon: BarChart3 },
      { label: "Logs & Audit Trails", to: "/admin/audit-trails", icon: ShieldCheck },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", to: "/admin/profile", icon: User },
      { label: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

function SidebarItem({
  item,
  collapsed,
  badgeCount = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  badgeCount?: number;
}) {
  const Icon = item.icon;
  const safeCount = Number.isFinite(badgeCount) ? Math.max(0, Math.floor(badgeCount)) : 0;
  const showBadge = safeCount > 0;
  const badgeLabel = safeCount > 99 ? "99+" : String(safeCount);

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "relative flex items-center rounded-md transition-colors",
          "py-2 text-sm font-medium",
          collapsed ? "justify-center px-2.5" : "gap-3 px-3",
          isActive
            ? "bg-gray-200 text-gray-900 dark:bg-[#0F1A2E] dark:text-slate-100"
            : "text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-[#0E1A30]",
          isActive
            ? "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-blue-600 dark:before:bg-blue-500"
            : "",
        ].join(" ")
      }
    >
      <span className="relative shrink-0">
        <Icon size={18} className="text-gray-900 dark:text-slate-200" />
        {collapsed && showBadge ? (
          <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {badgeLabel}
          </span>
        ) : null}
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {!collapsed && showBadge ? (
        <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
          {badgeLabel}
        </span>
      ) : null}
    </NavLink>
  );
}

export default function Sidebar({
  collapsed = false,
  unreadNotifications = 0,
  adminTier,
}: {
  collapsed?: boolean;
  unreadNotifications?: number;
  adminTier?: "SUPER" | "CDRRMO";
}) {
  const w = collapsed ? "w-[78px]" : "w-[255px]";
  const { isDark } = useThemeMode();
  const isSuper = adminTier === "SUPER";

  return (
    <aside
      className={[
        w,
        "bg-white border-r border-gray-300 h-screen shrink-0 flex flex-col dark:bg-[#0B1220] dark:border-[#162544]",
        "transition-[width] duration-200 ease-in-out",
      ].join(" ")}
    >
      <LifelineLogo
        variant="sidebar"
        collapsed={collapsed}
        iconSize={35}
        textClassName="text-3xl"
        logoColor={isDark ? "blue" : "red"}
      />

      <nav className="px-3 pt-1 flex-1 overflow-y-auto overflow-x-visible">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => (item.superOnly ? isSuper : true));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className={idx === 0 ? "" : "mt-3"}>
              {idx !== 0 ? (
                <div className={collapsed ? "my-2.5" : "my-3"}>
                  <div className="h-px bg-gray-200 dark:bg-[#162544]" />
                </div>
              ) : null}

              {!collapsed ? (
                <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400">
                  {section.title}
                </div>
              ) : null}

              <div className="space-y-1.5">
                {visibleItems.map((item) => (
                  <SidebarItem
                    key={item.to}
                    item={item}
                    collapsed={collapsed}
                    badgeCount={item.to === "/admin/notifications" ? unreadNotifications : 0}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
