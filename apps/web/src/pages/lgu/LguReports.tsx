import LguShell from "../../components/lgu/LguShell";
import InlineAlert from "../../components/ui/InlineAlert";
import { useLguReports } from "../../features/reports/hooks/useLguReports";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[#0B1220] dark:border-[#162544]">
      <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-gray-900 dark:text-slate-100">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function LguReports() {
  const vm = useLguReports();

  return (
    <LguShell title="Reports" subtitle="Operational summaries (derived)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Summary</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            These metrics are derived from emergencies and dispatches (no dedicated reports API yet).
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
            onClick={vm.exportTasksCsv}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={vm.tasks.length === 0}
          >
            Export Tasks CSV
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Total emergencies" value={String(vm.summary.totalEmergencies)} />
        <StatCard label="Active tasks" value={String(vm.summary.activeTasks)} sub="Status: ACCEPTED" />
        <StatCard label="Completed tasks" value={String(vm.summary.completedTasks)} sub="Status: VERIFIED" />
        <StatCard
          label="Avg response time"
          value={vm.summary.avgResponseMinutes === null ? "N/A" : `${vm.summary.avgResponseMinutes} min`}
          sub="Based on respondedAt - reportedAt"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
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
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Emergency type</div>
          <select
            value={vm.filters.emergencyType}
            onChange={(e) => vm.setFilters((p) => ({ ...p, emergencyType: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          >
            {vm.emergencyTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "ALL" ? "All" : t}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={vm.clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {vm.loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:bg-[#0B1220] dark:border-[#162544] dark:text-slate-300">
          Loading...
        </div>
      ) : null}

      {vm.error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Reports">
            {vm.error}
          </InlineAlert>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Tasks (Filtered)</div>
        <div className="text-xs text-gray-500 dark:text-slate-500">
          Showing {vm.tasks.length} dispatch records.
        </div>

        {vm.tasks.length === 0 ? (
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
                {vm.tasks.slice(0, 50).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-slate-200">{t.id}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{String(t.status || "").toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-gray-900 dark:text-slate-100">
                        {String(t.emergency?.emergencyType || "Emergency").toUpperCase()}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-500 font-mono">{t.emergency?.id || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{t.emergency?.barangayName || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {t.emergency?.reportedAt ? new Date(t.emergency.reportedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {t.respondedAt ? new Date(t.respondedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {t.completedAt ? new Date(t.completedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                      {t.verifiedAt ? new Date(t.verifiedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vm.tasks.length > 50 ? (
              <div className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500 border-t border-gray-200 dark:border-[#162544]">
                Showing first 50 rows. Export CSV for full list.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </LguShell>
  );
}

