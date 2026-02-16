import { useLguReports } from "../hooks/useLguReports";

type Props = ReturnType<typeof useLguReports> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[#0B1220] dark:border-[#162544]">
      <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-gray-900 dark:text-slate-100">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">{sub}</div> : null}
    </div>
  );
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

export default function LguReportsView(props: Props) {
  const { loading, error, onRefresh, exportTasksCsv, tasks, summary, filters, setFilters, emergencyTypeOptions, clearFilters } = props;

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Summary</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            These metrics are derived from emergencies and dispatches (no dedicated reports API yet).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
          <button
            onClick={exportTasksCsv}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={tasks.length === 0}
          >
            Export Tasks CSV
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Total emergencies" value={String(summary.totalEmergencies)} />
        <StatCard label="Active tasks" value={String(summary.activeTasks)} sub="Status: ACCEPTED" />
        <StatCard label="Completed tasks" value={String(summary.completedTasks)} sub="Status: VERIFIED" />
        <StatCard
          label="Avg response time"
          value={summary.avgResponseMinutes === null ? "N/A" : `${summary.avgResponseMinutes} min`}
          sub="Based on respondedAt - reportedAt"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Date from</div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Date to</div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544] md:col-span-2">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Emergency type</div>
          <select
            value={filters.emergencyType}
            onChange={(e) => setFilters((prev) => ({ ...prev, emergencyType: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          >
            {emergencyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All" : type}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Tasks (Filtered)</div>
        <div className="text-xs text-gray-500 dark:text-slate-500">Showing {tasks.length} dispatch records.</div>

        {tasks.length === 0 ? (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
            No tasks match the selected filters.
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Dispatch</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Emergency</th>
                  <th className="px-4 py-3">Barangay</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-4 py-3">Responded</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                {tasks.slice(0, 50).map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{task.id}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{String(task.status || "").toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-gray-900 dark:text-slate-100">
                        {String(task.emergency?.emergencyType || "Emergency").toUpperCase()}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-gray-500 dark:text-slate-500">{task.emergency?.id || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{task.emergency?.barangayName || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {task.emergency?.reportedAt ? new Date(task.emergency.reportedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {task.respondedAt ? new Date(task.respondedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {task.completedAt ? new Date(task.completedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {task.verifiedAt ? new Date(task.verifiedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length > 50 ? (
              <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-[#162544] dark:text-slate-500">
                Showing first 50 rows. Export CSV for full list.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

