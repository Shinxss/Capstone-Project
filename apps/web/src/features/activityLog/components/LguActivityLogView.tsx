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
    pageSize,
    setPageSize,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-slate-400">Read-only</div>
          <div className="text-xs text-gray-500 dark:text-slate-500">
            This log is recorded in the browser for now (server audit endpoint pending).
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Search</div>
            <input
              type="text"
              value={search}
              placeholder="Search actor, action, entity, time..."
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date from</div>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date to</div>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Action</div>
            <select
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            >
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Actor</div>
            <select
              value={filters.actor}
              onChange={(e) => setFilters((prev) => ({ ...prev, actor: e.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
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

          <div className="flex items-center gap-2">
            <select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value) || 10)}
              className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>

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

      {filtered.length === 0 ? (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {paginated.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-[#0E1626]">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{entry.actor}</td>
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
        <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:bg-[#0B1220] dark:border-[#162544]">
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
      )}
    </>
  );
}

