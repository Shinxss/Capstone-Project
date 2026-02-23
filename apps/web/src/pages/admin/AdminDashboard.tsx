import { Link } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAnalytics } from "@/features/adminAnalytics/hooks/useAdminAnalytics";

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useAdminAnalytics();

  return (
    <AdminShell title="Dashboard" subtitle="Dagupan City Lifeline command center">
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">{data?.scopeLabel ?? "City-wide overview"}</div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
            Loading dashboard...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Emergencies</div>
              <div className="mt-2 text-2xl font-extrabold text-red-600 dark:text-red-300">{data.counts.emergencies.OPEN}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Open incidents</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Volunteer Applications</div>
              <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-300">{data.counts.volunteerApplications.pending}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Pending verification</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
              <div className="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">Dispatch Tasks</div>
              <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-300">{data.counts.dispatchTasks.PENDING}</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">Pending response</div>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-200">Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/live-map" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
              Open Live Map
            </Link>
            <Link to="/admin/tasks" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
              Review Tasks
            </Link>
            <Link to="/admin/analytics" className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]">
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
