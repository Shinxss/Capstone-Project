import { Download, RefreshCw } from "lucide-react";

type Props = {
  onRefresh: () => void;
  onExport: () => void;
  exportDisabled: boolean;
  refreshing?: boolean;
};

export default function CompletedTasksHeader({
  onRefresh,
  onExport,
  exportDisabled,
  refreshing = false,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Completed Tasks</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Verified dispatch tasks for auditing and tracking.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#22304A] dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-[#111D31]"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} aria-hidden="true" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
