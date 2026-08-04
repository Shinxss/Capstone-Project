import { Search, SlidersHorizontal, X } from "lucide-react";
import { DISPATCH_SORT_OPTIONS } from "../constants/dispatchResponders.constants";
import type {
  DispatchResponderFilter,
  DispatchResponderFilterOption,
  DispatchResponderSort,
} from "../types/dispatchResponders.types";

type Props = {
  filterOptions: DispatchResponderFilterOption[];
  activeFilter: DispatchResponderFilter;
  searchQuery: string;
  sortBy: DispatchResponderSort;
  supportsRating: boolean;
  supportsEta: boolean;
  supportsLocation: boolean;
  onFilterChange: (filter: DispatchResponderFilter) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: DispatchResponderSort) => void;
};

function isSort(value: string): value is DispatchResponderSort {
  return DISPATCH_SORT_OPTIONS.some((option) => option.id === value);
}

export default function DispatchFilters({
  filterOptions,
  activeFilter,
  searchQuery,
  sortBy,
  supportsRating,
  supportsEta,
  supportsLocation,
  onFilterChange,
  onSearchChange,
  onSortChange,
}: Props) {
  const capability = { rating: supportsRating, eta: supportsEta, location: supportsLocation };
  return (
    <section aria-label="Responder filters" className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-[#1D2B43] dark:bg-[#0B1220] sm:px-6">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange(option.id)}
              disabled={option.disabled}
              title={option.disabled ? option.disabledReason : undefined}
              aria-pressed={activeFilter === option.id}
              className={`h-9 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 ${activeFilter === option.id ? "border-red-600 bg-red-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-[#2B3A55] dark:bg-[#101A2B] dark:text-slate-300 dark:hover:bg-[#17243A]"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Recommended using current availability, emergency-relevant skills, and live proximity.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="relative block">
          <span className="sr-only">Search responders</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search name, skill, role, or barangay" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#2B3A55] dark:bg-[#101A2B] dark:text-slate-100 dark:focus:ring-red-500/15" />
          {searchQuery ? <button type="button" onClick={() => onSearchChange("")} aria-label="Clear responder search" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1B2941] dark:hover:text-slate-200"><X size={15} /></button> : null}
        </label>
        <label className="relative block">
          <span className="sr-only">Sort responders</span>
          <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={sortBy} onChange={(event) => { if (isSort(event.target.value)) onSortChange(event.target.value); }} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#2B3A55] dark:bg-[#101A2B] dark:text-slate-200 dark:focus:ring-red-500/15">
            {DISPATCH_SORT_OPTIONS.map((option) => <option key={option.id} value={option.id} disabled={option.requires ? !capability[option.requires] : false}>{option.label}{option.requires && !capability[option.requires] ? " — unavailable" : ""}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}
