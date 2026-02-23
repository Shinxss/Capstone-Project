import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThemeMode } from "../features/theme/hooks/useThemeMode";
import { useNavigate } from "react-router-dom";
import { useLguSession } from "../features/auth/hooks/useLguSession";
import { clearLguSession } from "../features/auth/services/authStorage";
import { logout } from "../features/auth/services/lguAuth.service";
import { appendActivityLog } from "../features/activityLog/services/activityLog.service";
import type { LguNotification } from "../features/notifications/models/notifications.types";
import {
  fetchLguNotifications,
  markNotificationRead,
  markNotificationsRead,
} from "../features/notifications/services/notifications.service";

import {
  Search,
  Moon,
  Sun,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
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
  unreadNotifications?: number;
  portalPathPrefix?: string;
  loginPath?: string;

  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

type NotificationsTab = "UNREAD" | "READ";

function formatTimeAgo(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "-";
  const elapsedMs = Date.now() - date.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedHours = Math.floor(elapsedMs / 3600000);
  const elapsedDays = Math.floor(elapsedMs / 86400000);

  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  if (elapsedDays < 7) return `${elapsedDays}d ago`;
  return date.toLocaleDateString();
}

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function Header({
  title = "Dashboard",
  subtitle = "Welcome Back, John Doe",
  userName = "John Doe",
  userRole = "Administrator",
  unreadNotifications = 0,
  portalPathPrefix = "/lgu",
  loginPath = "/lgu/login",
  sidebarCollapsed = false,
  onToggleSidebar,
}: HeaderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsTab, setNotificationsTab] = useState<NotificationsTab>("UNREAD");
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<LguNotification[]>([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ read session user from localStorage via hook
  const { user } = useLguSession();

  // Theme
  const { isDark, toggle } = useThemeMode();

  // ✅ computed display values (fallback safe)
  const displayName =
    user?.firstName || user?.lastName
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : user?.username ?? userName;

  const displayRole = user?.role ?? userRole;

  const displaySubtitle = user ? `Welcome Back, ${displayName}` : subtitle;

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !item.archived).slice(0, 20),
    [notifications]
  );
  const unreadVisibleCount = useMemo(
    () => visibleNotifications.filter((item) => !item.read).length,
    [visibleNotifications]
  );
  const readVisibleCount = useMemo(
    () => visibleNotifications.filter((item) => item.read).length,
    [visibleNotifications]
  );
  const tabNotifications = useMemo(
    () =>
      visibleNotifications.filter((item) =>
        notificationsTab === "UNREAD" ? !item.read : item.read
      ),
    [visibleNotifications, notificationsTab]
  );
  const selectedNotification = useMemo(
    () =>
      selectedNotificationId
        ? notifications.find((item) => item.id === selectedNotificationId) ?? null
        : null,
    [notifications, selectedNotificationId]
  );

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const data = await fetchLguNotifications();
      setNotifications(data);
    } catch (e: any) {
      setNotificationsError(e?.response?.data?.message || e?.message || "Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const onBellClick = useCallback(() => {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        setNotificationsTab(unreadVisibleCount > 0 ? "UNREAD" : "READ");
      } else {
        setSelectedNotificationId(null);
      }
      return next;
    });
  }, [unreadVisibleCount]);

  const handleMarkOneRead = useCallback((id: string) => {
    markNotificationRead(id);
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    const ids = visibleNotifications.filter((item) => !item.read).map((item) => item.id);
    if (ids.length === 0) return;
    markNotificationsRead(ids);
    const idsSet = new Set(ids);
    setNotifications((prev) => prev.map((item) => (idsSet.has(item.id) ? { ...item, read: true } : item)));
  }, [visibleNotifications]);

  const handleOpenNotificationDetails = useCallback(
    (item: LguNotification) => {
      if (!item.read) handleMarkOneRead(item.id);
      setSelectedNotificationId(item.id);
    },
    [handleMarkOneRead]
  );

  const handleOpenNotificationsPage = useCallback(() => {
    setSelectedNotificationId(null);
    setNotificationsOpen(false);
    navigate(`${portalPathPrefix}/notifications`);
  }, [navigate, portalPathPrefix]);

  useEffect(() => {
    if (!notificationsOpen) return;
    void loadNotifications();
  }, [notificationsOpen, loadNotifications]);

  // close on outside click + ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Escape") {
        setSelectedNotificationId(null);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Best effort only.
    }

    appendActivityLog({
      action: "Auth logout",
      entityType: "system",
      entityId: user?.id ?? null,
    });

    clearLguSession(); // ✅ clears token + user
    setOpen(false);
    navigate(loginPath, { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-300 dark:bg-[#0B1220] dark:border-[#162544]">
      <div className="h-16 px-3 flex items-center justify-between">
        {/* Left: sidebar toggle + title */}
        <div className="min-w-65">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              disabled={!onToggleSidebar}
              className="h-10 w-10 rounded-md bg-white hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 dark:bg-[#0E1626] dark:hover:bg-[#122036]"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={!sidebarCollapsed}
            >
              <Sidebar
                size={18}
                className={sidebarCollapsed ? "opacity-70" : "opacity-100"}
              />
            </button>

            <div className="leading-tight">
              <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{displaySubtitle}</div>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 px-8">
          <div className="relative max-w-180 mx-auto">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="w-full h-11 rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base outline-none focus:border-gray-400 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Search"
            />
          </div>
        </div>

        {/* Right: icons + profile */}
        <div className="min-w-[320px] flex items-center justify-end gap-4">
          <IconBtn onClick={toggle} ariaLabel="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </IconBtn>
          <IconBtn
            ariaLabel="Open notifications"
            badgeCount={unreadNotifications}
            onClick={onBellClick}
          >
            <Bell size={18} />
          </IconBtn>
          <IconBtn>
            <Settings size={18} />
          </IconBtn>

          <div className="h-8 w-px bg-gray-300 mx-1 dark:bg-[#162544]" />

          {/* User dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-3 pr-1 rounded-lg hover:bg-gray-50 dark:hover:bg-[#122036]"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center dark:bg-[#0E1626] dark:border-[#162544]">
                <span className="h-4 w-4 rounded-full bg-white border border-gray-400" />
              </div>

              <div className="leading-tight text-left">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {displayName}
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-400">{displayRole}</div>
              </div>

              <span className="h-9 w-9 rounded-md hover:bg-gray-100 flex items-center justify-center dark:hover:bg-[#122036]">
                <ChevronDown size={18} className="text-gray-700 dark:text-slate-300" />
              </span>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50 dark:border-[#162544] dark:bg-[#0E1626]"
              >
                <MenuItem
                  icon={<User size={16} />}
                  label="Profile"
                  onClick={() => {
                    setOpen(false);
                    navigate(`${portalPathPrefix}/profile`);
                  }}
                />

                <MenuItem
                  icon={<Settings size={16} />}
                  label="Settings"
                  onClick={() => {
                    setOpen(false);
                    navigate(`${portalPathPrefix}/settings`);
                  }}
                />

                <div className="h-px bg-gray-200 dark:bg-[#162544]" />

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

      {notificationsOpen ? (
        <>
          <button
            type="button"
            aria-label="Close notifications drawer"
            className="fixed inset-0 z-[60] bg-black/20"
            onClick={() => {
              setSelectedNotificationId(null);
              setNotificationsOpen(false);
            }}
          />

          <aside
            className="fixed right-3 z-[70] w-[min(390px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-[#162544] dark:bg-[#0E1626]"
            style={{ top: 68, maxHeight: "calc(100vh - 84px)" }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#162544]">
              <div>
                <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Notifications</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {unreadVisibleCount > 0 ? `${unreadVisibleCount} unread` : "All caught up"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-[#122036]"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadVisibleCount === 0}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-[#122036]"
                >
                  Mark all read
                </button>
              </div>
            </div>

            <div className="px-3 pt-3">
              <div className="inline-flex w-full items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-[#162544] dark:bg-[#0B1220]">
                <button
                  type="button"
                  onClick={() => setNotificationsTab("UNREAD")}
                  className={[
                    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition",
                    notificationsTab === "UNREAD"
                      ? "bg-white text-red-700 shadow-sm dark:bg-[#122036] dark:text-red-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  <BellRing size={14} />
                  Unread
                  <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                    {unreadVisibleCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationsTab("READ")}
                  className={[
                    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition",
                    notificationsTab === "READ"
                      ? "bg-white text-emerald-700 shadow-sm dark:bg-[#122036] dark:text-emerald-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  <CheckCircle2 size={14} />
                  Read
                  <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-gray-300 px-1 text-[10px] text-gray-700 dark:bg-[#1B2A45] dark:text-slate-300">
                    {readVisibleCount}
                  </span>
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-214px)] overflow-y-auto p-3">
              {notificationsLoading ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
                  Loading notifications...
                </div>
              ) : null}

              {notificationsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                  {notificationsError}
                </div>
              ) : null}

              {!notificationsLoading && !notificationsError && tabNotifications.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
                  {notificationsTab === "UNREAD" ? "No unread notifications." : "No read notifications."}
                </div>
              ) : null}

              <div className="space-y-2">
                {tabNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenNotificationDetails(item)}
                    className={[
                      "w-full rounded-xl border px-3 py-2 text-left transition",
                      item.read
                        ? "border-gray-200 bg-white hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0B1220] dark:hover:bg-[#122036]"
                        : "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-500/25 dark:bg-red-500/10 dark:hover:bg-red-500/15",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">{item.title}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-slate-400">{item.message}</div>
                      </div>
                      {!item.read ? (
                        <span className="mt-0.5 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                          New
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-500">
                      <Clock3 size={11} />
                      {formatTimeAgo(item.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-3 text-center dark:border-[#162544]">
              <button
                type="button"
                onClick={handleOpenNotificationsPage}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all notifications
              </button>
            </div>
          </aside>
        </>
      ) : null}

      {selectedNotification ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close notification details"
            onClick={() => setSelectedNotificationId(null)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-[#162544]">
              <div>
                <div className="text-base font-extrabold text-gray-900 dark:text-slate-100">{selectedNotification.title}</div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  {String(selectedNotification.type).toUpperCase()} | {formatDateTime(selectedNotification.createdAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotificationId(null)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              {!selectedNotification.read ? (
                <div className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                  New / Unread
                </div>
              ) : null}

              <div>
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Message</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-slate-100">
                  {selectedNotification.message}
                </div>
              </div>

              {selectedNotification.source ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">
                  Source: {selectedNotification.source.kind} | {selectedNotification.source.id}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-[#162544]">
              {!selectedNotification.read ? (
                <button
                  type="button"
                  onClick={() => handleMarkOneRead(selectedNotification.id)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Mark as read
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedNotificationId(null)}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-0.75 bg-blue-600 dark:bg-blue-500" />
    </header>
  );
}

function IconBtn({
  children,
  onClick,
  ariaLabel,
  badgeCount = 0,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  badgeCount?: number;
}) {
  const safeCount = Number.isFinite(badgeCount) ? Math.max(0, Math.floor(badgeCount)) : 0;
  const showBadge = safeCount > 0;
  const badgeLabel = safeCount > 99 ? "99+" : String(safeCount);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative h-10 w-10 rounded-md border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:hover:bg-[#122036] dark:text-slate-200"
    >
      {children}
      {showBadge ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
          {badgeLabel}
        </span>
      ) : null}
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
        danger ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10" : "text-gray-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-[#122036]",
      ].join(" ")}
    >
      <span className="text-gray-700 dark:text-slate-300">{icon}</span>
      {label}
    </button>
  );
}
