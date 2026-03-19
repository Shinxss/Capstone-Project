import { History, Info, Search, Shield } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";
import { useLguActivityLog } from "../hooks/useLguActivityLog";

type Props = ReturnType<typeof useLguActivityLog> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

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

export default function LguActivityLogView(props: Props) {
  const {
    loading,
    error,
    onRefresh,
    filters,
    setFilters,
    actionOptions,
    actorOptions,
    clearFilters,
    search,
    setSearch,
    pagination,
    page,
    setPage,
    paginated,
    filtered,
  } = props;

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <>
      <div className="mb-4 flex items-start gap-3">
        <Shield size={28} className="mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-3xl font-bold leading-tight text-gray-900 dark:text-slate-100">Audit Log</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Track all system actions for transparency and accountability
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-[#F5EFE4] px-4 py-4 dark:border-amber-500/25 dark:bg-amber-500/10">
        <div className="flex items-start gap-3">
          <Info size={22} className="mt-0.5 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-xl font-semibold text-gray-900 dark:text-slate-100">Read-Only Audit Trail</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-slate-300">
              All system actions are logged here for transparency and accountability. Logs cannot be modified or deleted.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative xl:min-w-0 xl:flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={search}
              placeholder="Search actor, action, entity, time..."
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#2B4A7A]"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
            <input
              type="date"
              aria-label="Date from"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="h-11 min-w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:border-[#2B4A7A]"
            />

            <input
              type="date"
              aria-label="Date to"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="h-11 min-w-[150px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:border-[#2B4A7A]"
            />

            <select
              aria-label="Action"
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
              className="h-11 min-w-[160px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:border-[#2B4A7A]"
            >
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              aria-label="Actor"
              value={filters.actor}
              onChange={(e) => setFilters((prev) => ({ ...prev, actor: e.target.value }))}
              className="h-11 min-w-[160px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-300 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:border-[#2B4A7A]"
            >
              <option value="">All actors</option>
              {actorOptions.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500 dark:text-slate-400">
            Showing {filtered.length === 0 ? 0 : pagination.startIndex + 1}-{pagination.endIndex} of {pagination.totalItems}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
          >
            Clear filters
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState className="mt-4" icon={History} title="No log entries match your filters." />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:bg-[#0B1220] dark:border-[#162544]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-[#0E1626] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {paginated.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{entry.actor}</div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      {entry.actorRole ? entry.actorRole.toLowerCase() : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-slate-200">{entry.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    <div className="font-semibold">{entry.entityType}</div>
                    <div className="mt-0.5 font-mono">{entry.entityId || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="text-xs text-gray-500 dark:text-slate-400 sm:justify-self-start">
              {pagination.totalItems} {pagination.totalItems === 1 ? "item" : "items"}
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Previous
              </button>

              <div className="text-sm text-gray-600 dark:text-slate-300">
                Page {pagination.page} of {pagination.totalPages}
              </div>

              <button
                type="button"
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Next
              </button>
            </div>

            <div className="hidden text-xs text-gray-500 opacity-0 sm:block sm:justify-self-end dark:text-slate-400">
              {pagination.totalItems} {pagination.totalItems === 1 ? "item" : "items"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
