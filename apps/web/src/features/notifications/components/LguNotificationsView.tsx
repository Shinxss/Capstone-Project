import { useMemo } from "react";
import Modal from "../../../components/ui/Modal";
import type { NotificationType } from "../models/notifications.types";
import { useLguNotifications } from "../hooks/useLguNotifications";

type Props = ReturnType<typeof useLguNotifications> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function badgeClass(type: NotificationType) {
  switch (type) {
    case "emergency":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50";
    case "verification":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50";
    case "announcement":
      return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50";
    case "task":
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-[#162544]";
  }
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
    filters,
    setFilters,
    typeOptions,
    markAllRead,
    filtered,
    openDetails,
    markRead,
    detailsOpen,
    selected,
    closeDetails,
  } = props;

  const emptyLabel = useMemo(() => {
    if (filters.scope === "UNREAD") return "No unread notifications.";
    return "No notifications yet.";
  }, [filters.scope]);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">Filter and review notifications for your LGU scope.</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={markAllRead}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Scope</div>
          <select
            value={filters.scope}
            onChange={(e) => setFilters((prev) => ({ ...prev, scope: e.target.value as "ALL" | "UNREAD" }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:focus:border-slate-500"
          >
            <option value="ALL">All</option>
            <option value="UNREAD">Unread</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Type</div>
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as NotificationType | "ALL" }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:focus:border-slate-500"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Quick action</div>
          <button
            onClick={() => setFilters({ scope: "UNREAD", type: "ALL" })}
            className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Show unread
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {filtered.map((notification) => (
                <tr
                  key={notification.id}
                  className={["cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0E1626]", notification.read ? "opacity-80" : ""].join(" ")}
                  onClick={() => {
                    openDetails(notification);
                    if (!notification.read) markRead(notification.id);
                  }}
                >
                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", badgeClass(notification.type)].join(" ")}>
                      {String(notification.type).toUpperCase()}
                    </span>
                    {!notification.read ? (
                      <div className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">Unread</div>
                    ) : (
                      <div className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">Read</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">{notification.title}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {notification.message.length > 140 ? `${notification.message.slice(0, 140)}...` : notification.message}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(notification.id);
                      }}
                      disabled={notification.read}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
                    >
                      Mark read
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={detailsOpen && !!selected}
        title={selected?.title || "Notification"}
        subtitle={selected ? `${String(selected.type).toUpperCase()} • ${new Date(selected.createdAt).toLocaleString()}` : undefined}
        onClose={closeDetails}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
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

