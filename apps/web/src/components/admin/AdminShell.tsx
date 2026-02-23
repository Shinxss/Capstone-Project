import { useEffect, useMemo, useState } from "react";
import Header from "../Header";
import Sidebar from "./Sidebar";
import { useLguSession } from "../../features/auth/hooks/useLguSession";
import { useLguNotificationsUnreadCount } from "../../features/notifications/hooks/useLguNotificationsUnreadCount";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const STORAGE_KEY = "lifeline_admin_sidebar_collapsed";

export default function AdminShell({ title, subtitle, children }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  const unreadNotifications = useLguNotificationsUnreadCount();
  const { user } = useLguSession();

  const resolvedSubtitle = useMemo(() => {
    if (subtitle) return subtitle;
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName ? `Welcome back, ${fullName}` : "Dagupan City admin operations";
  }, [subtitle, user?.firstName, user?.lastName]);

  return (
    <div className="h-screen bg-[#F6F7F9] text-slate-900 flex overflow-hidden dark:bg-[#060C18] dark:text-slate-100">
      <Sidebar
        collapsed={collapsed}
        unreadNotifications={unreadNotifications}
        adminTier={user?.adminTier}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          title={title}
          subtitle={resolvedSubtitle}
          unreadNotifications={unreadNotifications}
          portalPathPrefix="/admin"
          loginPath="/lgu/login"
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />

        <div className="flex-1 overflow-y-auto bg-transparent dark:bg-[#060C18]">{children}</div>
      </div>
    </div>
  );
}
