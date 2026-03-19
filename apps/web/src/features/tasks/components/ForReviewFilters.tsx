import { RotateCcw, Search } from "lucide-react";
import type { ForReviewSort } from "../hooks/useLguTasksForReview";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  emergencyType: string;
  emergencyTypeOptions: string[];
  onEmergencyTypeChange: (value: string) => void;
  barangay: string;
  barangayOptions: string[];
  onBarangayChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  sort: ForReviewSort;
  onSortChange: (value: ForReviewSort) => void;
  missingProofOnly: boolean;
  onMissingProofOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterBadges: string[];
};

const controlClassName =
  "h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-100";

export default function ForReviewFilters({
  search,
  onSearchChange,
  emergencyType,
  emergencyTypeOptions,
  onEmergencyTypeChange,
  barangay,
  barangayOptions,
  onBarangayChange,
  date,
  onDateChange,
  sort,
  onSortChange,
  missingProofOnly,
  onMissingProofOnlyChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterBadges,
}: Props) {
  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          aria-hidden="true"
        />
        <label htmlFor="for-review-search" className="sr-only">
          Search queue
        </label>
        <input
          id="for-review-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search volunteer, task ID, barangay..."
          className={[controlClassName, "pl-9"].join(" ")}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Filters</div>
        {hasActiveFilters ? (
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {activeFilterBadges.length} active
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="for-review-emergency-type" className="mb-1 block text-[11px] font-semibold uppercase text-gray-500 dark:text-slate-400">
            Emergency type
          </label>
          <select
            id="for-review-emergency-type"
            value={emergencyType}
            onChange={(e) => onEmergencyTypeChange(e.target.value)}
            className={controlClassName}
          >
            {emergencyTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All" : option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="for-review-barangay" className="mb-1 block text-[11px] font-semibold uppercase text-gray-500 dark:text-slate-400">
            Barangay
          </label>
          <select
            id="for-review-barangay"
            value={barangay}
            onChange={(e) => onBarangayChange(e.target.value)}
            className={controlClassName}
          >
            {barangayOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All" : option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="for-review-date" className="mb-1 block text-[11px] font-semibold uppercase text-gray-500 dark:text-slate-400">
            Date
          </label>
          <input
            id="for-review-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={controlClassName}
          />
        </div>

        <div>
          <label htmlFor="for-review-sort" className="mb-1 block text-[11px] font-semibold uppercase text-gray-500 dark:text-slate-400">
            Sort
          </label>
          <select
            id="for-review-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ForReviewSort)}
            className={controlClassName}
          >
            <option value="NEWEST">Newest</option>
            <option value="OLDEST">Oldest</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={missingProofOnly}
            onChange={(e) => onMissingProofOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-red-600 dark:border-[#22365D]"
          />
          Missing proof only
        </label>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
      </div>

      {activeFilterBadges.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-[#22365D] dark:bg-[#101A30] dark:text-slate-300"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
