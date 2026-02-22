import { useMemo } from "react";
import {
  Archive,
  ArchiveRestore,
  Bell,
  BellRing,
  Check,
  Filter,
  Megaphone,
  RefreshCw,
  Search,
  Settings,
  Siren,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import type { LguNotification, NotificationType } from "../models/notifications.types";
import { useLguNotifications } from "../hooks/useLguNotifications";

type Props = ReturnType<typeof useLguNotifications> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function isSosNotification(notification: LguNotification) {
  const sourceId = String(notification.source?.id || "").toLowerCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (notification.type !== "emergency") return false;
  return sourceId.includes("sos") || text.includes("sos");
}

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

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

function notificationMeta(notification: LguNotification): {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  badgeClass: string;
  borderClass: string;
} {
  if (isSosNotification(notification)) {
    return {
      label: "SOS",
      icon: Siren,
      iconClass: "text-red-600",
      badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25",
      borderClass: "border-l-4 border-l-red-500",
    };
  }

  if (notification.type === "emergency") {
    return {
      label: "Emergency",
      icon: TriangleAlert,
      iconClass: "text-orange-600",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25",
      borderClass: "border-l-4 border-l-red-500",
    };
  }

  if (notification.type === "task" || notification.type === "verification") {
    return {
      label: "Volunteer",
      icon: UserRound,
      iconClass: "text-rose-600",
      badgeClass: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25",
      borderClass: "border-l-4 border-l-red-500",
    };
  }

  if (notification.type === "announcement") {
    return {
      label: "System",
      icon: Megaphone,
      iconClass: "text-blue-600",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
      borderClass: "border border-gray-200 dark:border-[#162544]",
    };
  }

  return {
    label: "System",
    icon: Settings,
    iconClass: "text-gray-600",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-[#162544]",
    borderClass: "border border-gray-200 dark:border-[#162544]",
  };
}

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/25 dark:text-red-200">
      <div className="flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function LguNotificationsView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    unreadCount,
    tabOptions,
    filters,
    setTab,
    setScope,
    setType,
    setQuery,
    setSort,
    typeOptions,
    markAllRead,
    archiveAll,
    unarchiveAll,
    archiveOne,
    unarchiveOne,
    filtered,
    openDetails,
    markRead,
    detailsOpen,
    selected,
    closeDetails,
  } = props;

  const viewingArchived = filters.scope === "ARCHIVED";
  const unreadInView = useMemo(() => filtered.filter((item) => !item.read).length, [filtered]);
  const hasActiveSearch = filters.query.trim().length > 0;

  const emptyLabel = useMemo(() => {
    if (hasActiveSearch) return "No notifications match your search.";
    if (filters.scope === "ARCHIVED") return "No archived notifications.";
    if (filters.scope === "UNREAD") return "No unread notifications.";
    if (filters.scope === "READ") return "No read notifications.";
    return "No notifications yet.";
  }, [filters.scope, hasActiveSearch]);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-slate-100">Notifications</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
              disabled={unreadInView === 0}
            >
              <Check size={16} />
              Mark all read
            </button>
            <button
              type="button"
              onClick={viewingArchived ? unarchiveAll : archiveAll}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/25 dark:bg-[#0E1626] dark:hover:bg-red-500/10"
              disabled={filtered.length === 0}
            >
              {viewingArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              {viewingArchived ? "Unarchive all" : "Archive all"}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              value={filters.query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, message, or source"
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#2B4A7A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <select
                value={filters.scope}
                onChange={(event) => setScope(event.target.value as "ALL" | "UNREAD" | "READ" | "ARCHIVED")}
                className="h-11 min-w-[140px] appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-8 text-sm font-semibold text-gray-700 outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:border-[#2B4A7A]"
              >
                <option value="ALL">All status</option>
                <option value="UNREAD">Unread only</option>
                <option value="READ">Read only</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <select
              value={filters.type}
              onChange={(event) => setType(event.target.value as NotificationType | "ALL")}
              className="h-11 min-w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:border-[#2B4A7A]"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(event) => setSort(event.target.value as "NEWEST" | "OLDEST")}
              className="h-11 min-w-[130px] rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:border-[#2B4A7A]"
            >
              <option value="NEWEST">Newest first</option>
              <option value="OLDEST">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="inline-flex w-full flex-wrap items-center gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1 dark:border-[#162544] dark:bg-[#0E1626]">
          {tabOptions.map((tab) => {
            const active = filters.tab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTab(tab.value)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-white text-gray-900 shadow-sm dark:bg-[#122036] dark:text-slate-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100",
                ].join(" ")}
              >
                <span>{tab.label}</span>
                <span
                  className={[
                    "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs",
                    active
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-700 dark:bg-[#1A2944] dark:text-slate-300",
                  ].join(" ")}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-6 mt-4 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
          {emptyLabel}
        </div>
      ) : (
        <div className="mx-6 mt-4 space-y-2 pb-6">
          {filtered.map((notification) => {
            const meta = notificationMeta(notification);
            const Icon = meta.icon;
            const cardReadClass = notification.archived
              ? "border border-gray-200 opacity-80 dark:border-[#162544]"
              : notification.read
                ? "border border-gray-200 dark:border-[#162544]"
                : meta.borderClass;
            return (
              <div
                key={notification.id}
                className={`rounded-2xl bg-white p-3 shadow-sm ${cardReadClass} dark:bg-[#0B1220]`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-[#0E1626]">
                    <Icon size={18} className={meta.iconClass} />
                  </div>

                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      openDetails(notification);
                      if (!notification.read) markRead(notification.id);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      {!notification.read ? (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-300">
                          New
                        </span>
                      ) : null}
                      {notification.archived ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">
                          Archived
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-0.5 text-lg font-bold leading-tight text-gray-900 dark:text-slate-100">{notification.title}</div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                      {notification.message.length > 140 ? `${notification.message.slice(0, 140)}...` : notification.message}
                    </div>
                  </button>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-xs text-gray-500 dark:text-slate-400">{formatTimeAgo(notification.createdAt)}</div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        markRead(notification.id);
                      }}
                      disabled={notification.read}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#122036]"
                      title={notification.read ? "Already read" : "Mark as read"}
                    >
                      {notification.read ? <Bell size={14} /> : <Check size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (notification.archived) {
                          unarchiveOne(notification.id);
                        } else {
                          archiveOne(notification.id);
                        }
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-red-600 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-400 dark:hover:bg-[#122036] dark:hover:text-red-300"
                      title={notification.archived ? "Unarchive notification" : "Archive notification"}
                    >
                      {notification.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={detailsOpen && !!selected}
        title={selected?.title || "Notification"}
        subtitle={selected ? `${String(selected.type).toUpperCase()} | ${formatDateTime(selected.createdAt)}` : undefined}
        onClose={closeDetails}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            {selected ? (
              <button
                type="button"
                onClick={() => (selected.archived ? unarchiveOne(selected.id) : archiveOne(selected.id))}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                {selected.archived ? "Unarchive" : "Archive"}
              </button>
            ) : null}
            {selected && !selected.read ? (
              <button
                type="button"
                onClick={() => selected && markRead(selected.id)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mark as read
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeDetails}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Close
            </button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">
              <BellRing size={14} />
              {formatTimeAgo(selected.createdAt)}
            </div>

            <div>
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Message</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-slate-100">{selected.message}</div>
            </div>

            {selected.source ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200">
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Source</div>
                <div className="mt-1">
                  {selected.source.kind}: <span className="font-mono">{selected.source.id}</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
