import { Download, RefreshCw, Search, X } from "lucide-react";
import type { TaskHistoryFilters } from "../../hooks/useLguTaskHistory";

type Props = {
  filters: TaskHistoryFilters;
  emergencyTypeOptions: string[];
  barangayOptions: string[];
  dateError: string | null;
  hasActiveFilters: boolean;
  exportDisabled: boolean;
  onFilterChange: (field: keyof TaskHistoryFilters, value: string) => void;
  onClear: () => void;
  onRefresh: () => void;
  onExport: () => void;
};

const inputClassName =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#263550] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:border-red-500 dark:focus:ring-red-500/15";

export default function CompletedTasksFilters({
  filters,
  emergencyTypeOptions,
  barangayOptions,
  dateError,
  hasActiveFilters,
  exportDisabled,
  onFilterChange,
  onClear,
  onRefresh,
  onExport,
}: Props) {
  return (
    <section
      aria-labelledby="completed-task-filters-title"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220] sm:p-5"
    >
      <div className="sr-only" id="completed-task-filters-title">Filter completed tasks</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Date From
          <input
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            aria-invalid={Boolean(dateError)}
            onChange={(event) => onFilterChange("dateFrom", event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Date To
          <input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            aria-invalid={Boolean(dateError)}
            onChange={(event) => onFilterChange("dateTo", event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Emergency Type
          <select
            value={filters.emergencyType}
            onChange={(event) => onFilterChange("emergencyType", event.target.value)}
            className={inputClassName}
          >
            {emergencyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All Types" : type}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Barangay
          <input
            type="text"
            list="completed-task-barangays"
            value={filters.barangay}
            onChange={(event) => onFilterChange("barangay", event.target.value)}
            placeholder="Select or type barangay"
            className={inputClassName}
          />
          <datalist id="completed-task-barangays">
            {barangayOptions.map((barangay) => <option key={barangay} value={barangay} />)}
          </datalist>
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Volunteer Name
          <span className="relative mt-1.5 block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={filters.volunteer}
              onChange={(event) => onFilterChange("volunteer", event.target.value)}
              placeholder="Search volunteer name"
              className={`${inputClassName} mt-0 pl-9`}
            />
          </span>
        </label>
      </div>

      {dateError ? <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-300" role="alert">{dateError}</p> : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-[#1C2940]">
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-[#152037]"
        >
          <X size={16} aria-hidden="true" />
          Clear Filters
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-[#263550] dark:text-slate-200 dark:hover:bg-[#152037]"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} aria-hidden="true" />
          Export CSV
        </button>
      </div>
    </section>
  );
}
