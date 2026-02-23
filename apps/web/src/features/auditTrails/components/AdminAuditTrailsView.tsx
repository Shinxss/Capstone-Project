import type { useAdminAuditTrails } from "../hooks/useAdminAuditTrails";

type Props = ReturnType<typeof useAdminAuditTrails>;

export default function AdminAuditTrailsView({
  items,
  loading,
  error,
  query,
  setQuery,
  pagination,
  refresh,
  canExport,
  exporting,
  onExport,
}: Props) {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <input
          value={query.q ?? ""}
          onChange={(event) => setQuery((prev) => ({ ...prev, q: event.target.value, page: 1 }))}
          placeholder="Search"
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
        />
        <input
          type="date"
          value={query.from ?? ""}
          onChange={(event) => setQuery((prev) => ({ ...prev, from: event.target.value, page: 1 }))}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
        />
        <input
          type="date"
          value={query.to ?? ""}
          onChange={(event) => setQuery((prev) => ({ ...prev, to: event.target.value, page: 1 }))}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
        />
        <input
          value={query.eventType ?? ""}
          onChange={(event) => setQuery((prev) => ({ ...prev, eventType: event.target.value, page: 1 }))}
          placeholder="Event type"
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
        />
        <select
          value={query.outcome ?? ""}
          onChange={(event) => setQuery((prev) => ({ ...prev, outcome: event.target.value, page: 1 }))}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
        >
          <option value="">All outcomes</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAIL">FAIL</option>
          <option value="DENY">DENY</option>
        </select>
        <select
          value={query.severity ?? ""}
          onChange={(event) => setQuery((prev) => ({ ...prev, severity: event.target.value, page: 1 }))}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
        >
          <option value="">All severities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
        {canExport ? (
          <button
            type="button"
            onClick={() => void onExport()}
            disabled={exporting}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
          Loading audit logs...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {items.map((item) => (
                <tr key={item.eventId}>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100">{item.eventType}</div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400">{item.action}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                    {item.outcome} / {item.severity}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                    {item.actor?.id ?? "-"} ({item.actor?.role ?? "-"})
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                    {item.target?.type ?? "-"} {item.target?.id ? `(${item.target.id})` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{item.scopeBarangay || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
        <span>
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))}
            disabled={(query.page ?? 1) <= 1 || loading}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: Math.min(pagination.totalPages, (prev.page ?? 1) + 1),
              }))
            }
            disabled={(query.page ?? 1) >= pagination.totalPages || loading}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
