import React from "react";
import { useThemeMode } from "../../features/theme/hooks/useThemeMode";
import { NavLink, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";

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
  ChevronDown,
  Activity,
  BadgeCheck,
  UserPlus,
  CircleDot,
  Clock4,
  CheckCircle2,
  ArchiveX,
} from "lucide-react";

import { LifelineLogo } from "../../components/LifelineLogo";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SubItem = {
  label: string;
  to: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
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
      {
        label: "Approvals / Verification",
        to: "/lgu/approvals",
        icon: ClipboardCheck,
      },
      { label: "Activity Log", to: "/lgu/activity-log", icon: Activity },
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

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;

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
            : "text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-[#0E1A30] dark:text-slate-200 dark:hover:bg-[#0E1A30]",
          isActive
            ? "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-blue-600 dark:before:bg-blue-500"
            : "",
        ].join(" ")
      }
    >
      <Icon size={18} className="text-gray-900 dark:text-slate-200" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SidebarSubmenu({
  label,
  icon: Icon,
  basePath,
  collapsed,
  items,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  basePath: string;
  collapsed: boolean;
  items: SubItem[];
}) {
  const location = useLocation();

  const isInSection = location.pathname.startsWith(basePath);
  const isChildActive = items.some((i) => {
    const to = i.to;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  });
  const active = isInSection || isChildActive;

  // Expanded mode accordion
  const [open, setOpen] = React.useState<boolean>(active);

  // Collapsed mode flyout
  const [flyoutOpen, setFlyoutOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const calcPos = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.round(r.right + 12); // gap outside sidebar
    const top = Math.round(r.top);

    setPos({ left, top });
  }, []);

  const openFlyout = React.useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setFlyoutOpen(true);
  }, []);

  const closeFlyout = React.useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyoutOpen(false), 120);
  }, []);

  React.useEffect(() => {
    if (!collapsed && active) setOpen(true);
  }, [active, collapsed]);

  React.useEffect(() => {
    // close on route change
    setFlyoutOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!flyoutOpen) return;
    calcPos();

    const onResize = () => calcPos();
    // capture scrolls from nested containers too
    const onScroll = () => calcPos();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [flyoutOpen, calcPos]);

  // -------------------------
  // COLLAPSED: flyout via portal (NOT clipped)
  // -------------------------
  if (collapsed) {
    return (
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onMouseEnter={openFlyout}
          onMouseLeave={closeFlyout}
          onClick={() => (flyoutOpen ? setFlyoutOpen(false) : openFlyout())}
          title={label}
          aria-haspopup="menu"
          aria-expanded={flyoutOpen}
          className={[
            "relative w-full flex items-center justify-center rounded-md transition-colors",
            "py-2 text-sm font-medium",
            active
            ? "bg-gray-200 text-gray-900 dark:bg-[#0F1A2E] dark:text-slate-100"
            : "text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-[#0E1A30] dark:text-slate-200 dark:hover:bg-[#0E1A30]",
            active
              ? "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-blue-600 dark:before:bg-blue-500"
              : "",
          ].join(" ")}
        >
          <Icon size={18} className="text-gray-900 dark:text-slate-200" />
        </button>

        {flyoutOpen && pos
          ? createPortal(
              <div
                role="menu"
                onMouseEnter={openFlyout}
                onMouseLeave={closeFlyout}
                className={[
                  "fixed z-[9999]",
                  "w-60 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[#162544] dark:bg-[#0E1626]",
                  "p-2",
                ].join(" ")}
                style={{ left: pos.left, top: pos.top }}
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase dark:text-slate-400 dark:text-slate-400 tracking-wide">
                  {label}
                </div>

                <div className="mt-1 space-y-1">
                  {items.map((s) => {
                    const SubIcon = s.icon;
                    return (
                      <NavLink
                        key={s.to}
                        to={s.to}
                        role="menuitem"
                        className={({ isActive }) =>
                          [
                            "relative flex items-center gap-2 rounded-md",
                            "px-2 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-gray-200 text-gray-900 dark:bg-[#0F1A2E] dark:text-slate-100"
                              : "text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-[#0E1A30] dark:text-slate-200 dark:hover:bg-[#0E1A30]",
                            isActive
                              ? "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-blue-600 dark:before:bg-blue-500"
                              : "",
                          ].join(" ")
                        }
                      >
                        {SubIcon ? <SubIcon size={16} className="text-gray-900 dark:text-slate-200" /> : null}
                        <span className="truncate">{s.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    );
  }

  // -------------------------
  // EXPANDED: accordion list
  // -------------------------
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "relative w-full flex items-center rounded-md transition-colors",
          "py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-[#0E1A30]",
          "gap-3 px-3",
          active ? "bg-gray-200 text-gray-900" : "",
          active
            ? "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-blue-600 dark:before:bg-blue-500"
            : "",
        ].join(" ")}
      >
        <Icon size={18} className="text-gray-900 dark:text-slate-200" />
        <span className="truncate">{label}</span>
        <span className="ml-auto">
          <ChevronDown
            size={16}
            className={["transition-transform", open ? "rotate-180" : "rotate-0"].join(" ")}
          />
        </span>
      </button>

      {open && (
        <div className="mt-1">
          <div className="relative px-3">
            <div className="absolute left-[21px] top-1 bottom-1 w-px bg-gray-200 dark:bg-[#162544]" />

            <div className="space-y-1">
              {items.map((s) => {
                const SubIcon = s.icon;

                return (
                  <NavLink
                    key={s.to}
                    to={s.to}
                    className={({ isActive }) =>
                      [
                        "relative flex items-center gap-2 rounded-md",
                        "py-1.5 text-sm transition-colors px-3",
                        isActive
                          ? "bg-gray-200 text-gray-900"
                          : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-[#0E1A30]",
                      ].join(" ")
                    }
                  >
                    <span className="absolute left-[21px] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-300 dark:bg-slate-500" />
                    <span className="w-6 shrink-0" />
                    {SubIcon ? <SubIcon size={16} className="text-gray-800 dark:text-slate-300" /> : null}
                    <span className="truncate">{s.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const w = collapsed ? "w-[78px]" : "w-[255px]";
  const { isDark } = useThemeMode();

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

      {/* IMPORTANT: overflow-x-visible so flyout won't get clipped */}
     <nav className="px-3 pt-1 flex-1 overflow-y-auto overflow-x-visible">
        {navSections.map((section, idx) => (
          <div key={section.title} className={idx === 0 ? "" : "mt-3"}>
            {idx !== 0 && (
              <div className={collapsed ? "my-2.5" : "my-3"}>
                <div className="h-px bg-gray-200 dark:bg-[#162544]" />
              </div>
            )}

            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:text-slate-400 dark:text-slate-400">
                {section.title}
              </div>
            )}

            <div className="space-y-1.5">
              {section.title === "Operations" && (
                <>
                  <SidebarSubmenu
                    label="Volunteers"
                    icon={Users}
                    basePath="/lgu/volunteers"
                    collapsed={collapsed}
                    items={[
                      {
                        label: "Verified Volunteers",
                        to: "/lgu/volunteers/verified",
                        icon: BadgeCheck,
                      },
                      { label: "Applicants", to: "/lgu/volunteers/applicants", icon: UserPlus },
                    ]}
                  />

                  <SidebarSubmenu
                    label="Tasks"
                    icon={ClipboardList}
                    basePath="/lgu/tasks"
                    collapsed={collapsed}
                    items={[
                      { label: "In Progress", to: "/lgu/tasks/in-progress", icon: CircleDot },
                      { label: "For Review", to: "/lgu/tasks/for-review", icon: Clock4 },
                      { label: "Completed", to: "/lgu/tasks/completed", icon: CheckCircle2 },
                      { label: "Canceled", to: "/lgu/tasks/canceled", icon: ArchiveX },
                    ]}
                  />
                </>
              )}

              {section.items.map((item) => (
                <SidebarItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <div className={collapsed ? "my-2.5" : "my-3"}>
          <div className="h-px bg-gray-200 dark:bg-[#162544]" />
        </div>

        <NavLink
          to="/lgu/settings"
          title={collapsed ? "Settings" : undefined}
          className={({ isActive }) =>
            [
              "relative flex items-center rounded-md transition-colors",
              "py-2 text-sm font-medium",
              collapsed ? "justify-center px-2.5" : "gap-3 px-3",
              isActive
            ? "bg-gray-200 text-gray-900 dark:bg-[#0F1A2E] dark:text-slate-100"
            : "text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-[#0E1A30] dark:text-slate-200 dark:hover:bg-[#0E1A30]",
              isActive
                ? "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-blue-600 dark:before:bg-blue-500"
                : "",
            ].join(" ")
          }
        >
          <Settings size={18} className="text-gray-900 dark:text-slate-200" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
