import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLguSession } from "../features/auth/hooks/useLguSession";
import { clearLguSession } from "../features/auth/services/authStorage";

import {
  Search,
  Moon,
  Bell,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Sidebar,
} from "lucide-react";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;

  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export default function Header({
  title = "Dashboard",
  subtitle = "Welcome Back, John Doe",
  userName = "John Doe",
  userRole = "Administrator",
  sidebarCollapsed = false,
  onToggleSidebar,
}: HeaderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ read session user from localStorage via hook
  const { user } = useLguSession();

  // ✅ computed display values (fallback safe)
  const displayName =
    user?.firstName || user?.lastName
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : user?.username ?? userName;

  const displayRole = user?.role ?? userRole;

  const displaySubtitle = user ? `Welcome Back, ${displayName}` : subtitle;

  // close on outside click + ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleLogout() {
    clearLguSession(); // ✅ clears token + user
    setOpen(false);
    navigate("/lgu/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-300">
      <div className="h-16 px-3 flex items-center justify-between">
        {/* Left: sidebar toggle + title */}
        <div className="min-w-[260px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              disabled={!onToggleSidebar}
              className="h-10 w-10 rounded-md bg-white hover:bg-gray-200 flex items-center justify-center disabled:opacity-50"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={!sidebarCollapsed}
            >
              <Sidebar
                size={18}
                className={sidebarCollapsed ? "opacity-70" : "opacity-100"}
              />
            </button>

            <div className="leading-tight">
              <div className="text-xl font-bold text-gray-900">{title}</div>
              <div className="text-sm text-gray-500">{displaySubtitle}</div>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 px-8">
          <div className="relative max-w-[720px] mx-auto">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="w-full h-11 rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base outline-none focus:border-gray-400"
              placeholder="Search"
            />
          </div>
        </div>

        {/* Right: icons + profile */}
        <div className="min-w-[320px] flex items-center justify-end gap-4">
          <IconBtn>
            <Moon size={18} />
          </IconBtn>
          <IconBtn>
            <Bell size={18} />
          </IconBtn>
          <IconBtn>
            <Settings size={18} />
          </IconBtn>

          <div className="h-8 w-px bg-gray-300 mx-1" />

          {/* User dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-3 pr-1 rounded-lg hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
                <span className="h-4 w-4 rounded-full bg-white border border-gray-400" />
              </div>

              <div className="leading-tight text-left">
                <div className="text-sm font-semibold text-gray-900">
                  {displayName}
                </div>
                <div className="text-xs text-gray-600">{displayRole}</div>
              </div>

              <span className="h-9 w-9 rounded-md hover:bg-gray-100 flex items-center justify-center">
                <ChevronDown size={18} className="text-gray-700" />
              </span>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50"
              >
                <MenuItem
                  icon={<User size={16} />}
                  label="Profile"
                  onClick={() => {
                    setOpen(false);
                    navigate("/lgu/profile");
                  }}
                />

                <MenuItem
                  icon={<Settings size={16} />}
                  label="Settings"
                  onClick={() => {
                    setOpen(false);
                    navigate("/lgu/settings");
                  }}
                />

                <div className="h-px bg-gray-200" />

                <MenuItem
                  icon={<LogOut size={16} className="text-red-600" />}
                  label="Logout"
                  danger
                  onClick={handleLogout}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-[3px] bg-blue-600" />
    </header>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="h-10 w-10 rounded-md border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700"
    >
      {children}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-left",
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-800 hover:bg-gray-50",
      ].join(" ")}
    >
      <span className="text-gray-700">{icon}</span>
      {label}
    </button>
  );
}
