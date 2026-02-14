import { useMemo } from "react";
import LguShell from "../../components/lgu/LguShell";
import Modal from "../../components/ui/Modal";
import InlineAlert from "../../components/ui/InlineAlert";
import { useLguNotifications } from "../../features/notifications/hooks/useLguNotifications";
import type { NotificationType } from "../../features/notifications/models/notifications.types";

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

export default function LguNotifications() {
  const vm = useLguNotifications();

  const emptyLabel = useMemo(() => {
    if (vm.filters.scope === "UNREAD") return "No unread notifications.";
    return "No notifications yet.";
  }, [vm.filters.scope]);

  return (
    <LguShell title="Notifications" subtitle="Task updates, emergencies, verification needed, announcements">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            {vm.unreadCount > 0 ? `${vm.unreadCount} unread` : "All caught up"}
          </div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            Filter and review notifications for your LGU scope.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={vm.refresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={vm.markAllRead}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={vm.unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Scope</div>
          <select
            value={vm.filters.scope}
            onChange={(e) => vm.setFilters((p) => ({ ...p, scope: e.target.value as any }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:focus:border-slate-500"
          >
            <option value="ALL">All</option>
            <option value="UNREAD">Unread</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Type</div>
          <select
            value={vm.filters.type}
            onChange={(e) => vm.setFilters((p) => ({ ...p, type: e.target.value as any }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100 dark:focus:border-slate-500"
          >
            {vm.typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Quick action</div>
          <button
            onClick={() => {
              vm.setFilters({ scope: "UNREAD", type: "ALL" });
            }}
            className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Show unread
          </button>
        </div>
      </div>

      {vm.loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          Loading...
        </div>
      ) : null}

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Notifications">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {!vm.loading && !vm.error && vm.filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          {emptyLabel}
        </div>
      ) : null}

      {!vm.loading && !vm.error && vm.filtered.length > 0 ? (
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
              {vm.filtered.map((n) => (
                <tr
                  key={n.id}
                  className={["cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0E1626]", n.read ? "opacity-80" : ""].join(" ")}
                  onClick={() => {
                    vm.openDetails(n);
                    if (!n.read) vm.markRead(n.id);
                  }}
                >
                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", badgeClass(n.type)].join(" ")}>
                      {String(n.type).toUpperCase()}
                    </span>
                    {!n.read ? (
                      <div className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        Unread
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">Read</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">{n.title}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {n.message.length > 140 ? n.message.slice(0, 140) + "..." : n.message}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        vm.markRead(n.id);
                      }}
                      disabled={n.read}
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
      ) : null}

      <Modal
        open={vm.detailsOpen && !!vm.selected}
        title={vm.selected?.title || "Notification"}
        subtitle={vm.selected ? `${String(vm.selected.type).toUpperCase()} • ${new Date(vm.selected.createdAt).toLocaleString()}` : undefined}
        onClose={vm.closeDetails}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            {vm.selected && !vm.selected.read ? (
              <button
                type="button"
                onClick={() => vm.selected && vm.markRead(vm.selected.id)}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mark as read
              </button>
            ) : null}
            <button
              type="button"
              onClick={vm.closeDetails}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Close
            </button>
          </div>
        }
      >
        {vm.selected ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Message</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-slate-100">{vm.selected.message}</div>
            </div>

            {vm.selected.source ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200">
                <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Source</div>
                <div className="mt-1">
                  {vm.selected.source.kind}: <span className="font-mono">{vm.selected.source.id}</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </LguShell>
  );
}

