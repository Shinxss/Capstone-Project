import React from "react";
import { NotificationsSummaryBanner } from "./NotificationsSummaryBanner";
import { NotificationsTabs } from "./NotificationsTabs";
import type { NotificationFilter } from "../models/mobileNotification";

type NotificationFilterTabsProps = {
  visible?: boolean;
  activeTab: NotificationFilter;
  onTabChange: (tab: NotificationFilter) => void;
  unreadByFilter: Partial<Record<NotificationFilter, number>>;
  unreadCount: number;
  onPressMarkAllRead: () => void;
};

export function NotificationFilterTabs({
  visible = true,
  activeTab,
  onTabChange,
  unreadByFilter,
  unreadCount,
  onPressMarkAllRead,
}: NotificationFilterTabsProps) {
  if (!visible) return null;

  return (
    <>
      <NotificationsTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        unreadByFilter={unreadByFilter}
      />

      <NotificationsSummaryBanner
        unreadCount={unreadCount}
        disabled={unreadCount === 0}
        onPressMarkAllRead={onPressMarkAllRead}
      />
    </>
  );
}
