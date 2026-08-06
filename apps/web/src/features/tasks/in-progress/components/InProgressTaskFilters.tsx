import { Eraser, Search } from "lucide-react";
import { IN_PROGRESS_SORT_OPTIONS } from "../constants/inProgressTasks.constants";
import type { InProgressFilterOptions, InProgressSort, InProgressTaskFilters } from "../types/inProgressTask.types";
import { parseInProgressSort, parsePriorityFilter } from "../utils/inProgressTask.utils";

type Props = {
  filters: InProgressTaskFilters;
  options: InProgressFilterOptions;
  sort: InProgressSort;
  filtersActive: boolean;
  onFilterChange: <K extends keyof InProgressTaskFilters>(key: K, value: InProgressTaskFilters[K]) => void;
  onSortChange: (sort: InProgressSort) => void;
  onClear: () => void;
};

const controlClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:ring-red-500/15";

export default function InProgressTaskFilters({ filters, options, sort, filtersActive, onFilterChange, onSortChange, onClear }: Props) {
  return (
    <section aria-label="Task filters" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.25fr_auto_auto] xl:items-end">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Emergency Type
          <select value={filters.emergencyType} onChange={(event) => onFilterChange("emergencyType", event.target.value)} className={`mt-2 ${controlClass}`}>
            <option value="ALL">All Types</option>
            {options.emergencyTypes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Barangay
          <select value={filters.barangay} onChange={(event) => onFilterChange("barangay", event.target.value)} className={`mt-2 ${controlClass}`}>
            <option value="ALL">All Barangays</option>
            {options.barangays.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Priority
          <select value={filters.priority} onChange={(event) => onFilterChange("priority", parsePriorityFilter(event.target.value))} className={`mt-2 ${controlClass}`}>
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="UNSPECIFIED">Unspecified</option>
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Search Responder
          <span className="relative mt-2 block">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filters.responder} onChange={(event) => onFilterChange("responder", event.target.value)} placeholder="Search responder name..." className={`${controlClass} pl-9`} />
          </span>
        </label>
        <button type="button" onClick={onClear} disabled={!filtersActive} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#24324A] dark:text-slate-200 dark:hover:bg-[#122036]">
          <Eraser size={16} /> Clear
        </button>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Sort by
          <select value={sort} onChange={(event) => onSortChange(parseInProgressSort(event.target.value))} className={`mt-2 min-w-40 ${controlClass}`}>
            {IN_PROGRESS_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}
