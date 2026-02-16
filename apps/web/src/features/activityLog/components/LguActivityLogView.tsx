import { useLguActivityLog } from "../hooks/useLguActivityLog";

type Props = ReturnType<typeof useLguActivityLog> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function formatMetadata(value: unknown) {
  if (!value) return "-";
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 140 ? `${serialized.slice(0, 140)}...` : serialized;
  } catch {
    return "-";
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

export default function LguActivityLogView(props: Props) {
  const { loading, error, onRefresh, filters, setFilters, actionOptions, actorOptions, clearFilters, filtered } = props;

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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date from</div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
          <div className="text-xs font-semibold text-gray-500 uppercase dark:text-slate-400">Date to</div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-100"
          />
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
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

        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:bg-[#0B1220] dark:border-[#162544]">
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
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:bg-[#0E1626] dark:border-[#162544] dark:text-slate-200 dark:hover:bg-[#122036]"
            >
              Clear
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
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#162544]">
              {filtered.map((entry) => (
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
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{formatMetadata(entry.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

