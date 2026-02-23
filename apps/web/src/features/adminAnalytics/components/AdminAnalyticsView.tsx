import type { useAdminAnalytics } from "../hooks/useAdminAnalytics";

type Props = ReturnType<typeof useAdminAnalytics>;

function metricCard(label: string, value: number, accent: string) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-extrabold ${accent}`}>{value}</div>
    </div>
  );
}

export default function AdminAnalyticsView({ range, setRange, data, loading, error, refresh }: Props) {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{data?.scopeLabel ?? "Analytics overview"}</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as "7d" | "30d")}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
          Loading analytics...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {data && !loading && !error ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {metricCard("Emergencies Open", data.counts.emergencies.OPEN, "text-red-600 dark:text-red-300")}
            {metricCard("Emergencies Acknowledged", data.counts.emergencies.ACKNOWLEDGED, "text-amber-600 dark:text-amber-300")}
            {metricCard("Emergencies Resolved", data.counts.emergencies.RESOLVED, "text-emerald-600 dark:text-emerald-300")}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">Volunteer Applications</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {metricCard("Pending", data.counts.volunteerApplications.pending, "text-amber-600 dark:text-amber-300")}
                {metricCard("Verified", data.counts.volunteerApplications.verified, "text-emerald-600 dark:text-emerald-300")}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">Dispatch Tasks</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {metricCard("Pending", data.counts.dispatchTasks.PENDING, "text-amber-600 dark:text-amber-300")}
                {metricCard("Accepted", data.counts.dispatchTasks.ACCEPTED, "text-blue-600 dark:text-blue-300")}
                {metricCard("Done", data.counts.dispatchTasks.DONE, "text-indigo-600 dark:text-indigo-300")}
                {metricCard("Verified", data.counts.dispatchTasks.VERIFIED, "text-emerald-600 dark:text-emerald-300")}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">Daily Trend ({range})</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-gray-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Open</th>
                    <th className="py-2 pr-3">Ack</th>
                    <th className="py-2 pr-3">Resolved</th>
                    <th className="py-2 pr-3">Pending Apps</th>
                    <th className="py-2 pr-3">Verified Apps</th>
                    <th className="py-2 pr-3">Pending Tasks</th>
                    <th className="py-2 pr-3">Accepted</th>
                    <th className="py-2 pr-3">Done</th>
                    <th className="py-2 pr-3">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
                  {data.trends.emergencies.map((row, idx) => (
                    <tr key={row.date}>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{row.date}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{row.OPEN}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{row.ACKNOWLEDGED}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{row.RESOLVED}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{data.trends.volunteerApplications[idx]?.pending ?? 0}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{data.trends.volunteerApplications[idx]?.verified ?? 0}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{data.trends.dispatchTasks[idx]?.PENDING ?? 0}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{data.trends.dispatchTasks[idx]?.ACCEPTED ?? 0}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{data.trends.dispatchTasks[idx]?.DONE ?? 0}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{data.trends.dispatchTasks[idx]?.VERIFIED ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
