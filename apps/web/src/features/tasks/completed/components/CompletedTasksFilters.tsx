import { Download, Search, X } from "lucide-react";

type Props = {
  searchQuery: string;
  exportDisabled: boolean;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onExport: () => void;
};

export default function CompletedTasksFilters({
  searchQuery,
  exportDisabled,
  hasActiveFilters,
  onSearchChange,
  onClear,
  onExport,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by task ID, volunteer, barangay, or emergency type..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#263550] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:border-red-500 dark:focus:ring-red-500/15"
        />
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-[#152037]"
      >
        <X size={16} aria-hidden="true" />
        Clear Filters
      </button>

      <button
        type="button"
        onClick={onExport}
        disabled={exportDisabled}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={16} aria-hidden="true" />
        Export CSV
      </button>
    </div>
  );
}
