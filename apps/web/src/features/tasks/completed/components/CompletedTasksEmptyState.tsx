import { BadgeCheck, X } from "lucide-react";

type Props = { hasActiveFilters: boolean; onClear: () => void };

export default function CompletedTasksEmptyState({ hasActiveFilters, onClear }: Props) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
        <BadgeCheck size={30} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No completed tasks found</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {hasActiveFilters
          ? "No verified dispatches match the selected filters. Adjust or clear the filters to see more results."
          : "Verified dispatches will appear here after they complete the review process."}
      </p>
      {hasActiveFilters ? (
        <button type="button" onClick={onClear} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#293852] dark:text-slate-200 dark:hover:bg-[#152037]">
          <X size={16} aria-hidden="true" />
          Clear Filters
        </button>
      ) : null}
    </div>
  );
}
