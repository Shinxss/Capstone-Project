import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "../Header";
import { useLguNotificationsUnreadCount } from "../../features/notifications/hooks/useLguNotificationsUnreadCount";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const STORAGE_KEY = "lifeline_lgu_sidebar_collapsed";

export default function LguShell({ title, subtitle, children }: Props) {
  // ✅ read collapsed state once (so it survives page changes)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // ✅ persist whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  const unreadNotifications = useLguNotificationsUnreadCount();

  return (
    <div className="h-screen bg-[#F6F7F9] text-slate-900 flex overflow-hidden dark:bg-[#060C18] dark:text-slate-100">
      <Sidebar collapsed={collapsed} unreadNotifications={unreadNotifications} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          title={title}
          subtitle={subtitle}
          unreadNotifications={unreadNotifications}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
        />

        {/* ✅ only page content scrolls */}
        <div className="flex-1 overflow-y-auto bg-transparent dark:bg-[#060C18]">{children}</div>
      </div>
    </div>
  );
}
