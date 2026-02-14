import LguShell from "../../components/lgu/LguShell";
import InlineAlert from "../../components/ui/InlineAlert";
import { useActivityLog } from "../../features/activityLog/hooks/useActivityLog";

function fmtMeta(v: unknown) {
  if (!v) return "-";
  try {
    const s = JSON.stringify(v);
    return s.length > 140 ? s.slice(0, 140) + "..." : s;
  } catch {
    return "-";
  }
}

export default function LguActivityLog() {
  const vm = useActivityLog();

  return (
    <LguShell title="Activity Log" subtitle="Audit trail of LGU actions (UI log)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Read-only</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            This log is recorded in the browser for now (server audit endpoint pending).
          </div>
        </div>

        <button
          onClick={vm.refresh}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date from</div>
          <input
            type="date"
            value={vm.filters.dateFrom}
            onChange={(e) => vm.setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date to</div>
          <input
            type="date"
            value={vm.filters.dateTo}
            onChange={(e) => vm.setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Action</div>
          <select
            value={vm.filters.action}
            onChange={(e) => vm.setFilters((p) => ({ ...p, action: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          >
            <option value="">All actions</option>
            {vm.actionOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Actor</div>
          <select
            value={vm.filters.actor}
            onChange={(e) => vm.setFilters((p) => ({ ...p, actor: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          >
            <option value="">All actors</option>
            {vm.actorOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={vm.clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Activity Log">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      {vm.filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          No log entries match your filters.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {vm.filtered.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{e.actor}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-slate-200">{e.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    <div className="font-semibold">{e.entityType}</div>
                    <div className="mt-0.5 font-mono">{e.entityId || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {e.timestamp ? new Date(e.timestamp).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{fmtMeta(e.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LguShell>
  );
}

