import {
  CalendarDays,
  ChevronDown,
  Filter,
  MapPin,
  RotateCcw,
  Search,
} from "lucide-react";
import type {
  EmergencyApprovalStatus,
  EmergencyVerificationFilters,
} from "../models/approvals.types";

type Props = {
  filters: EmergencyVerificationFilters;
  emergencyTypeOptions: string[];
  barangayOptions: string[];
  onChange: (updater: (previous: EmergencyVerificationFilters) => EmergencyVerificationFilters) => void;
  onClear: () => void;
};

function SelectShell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="absolute -top-2 left-3 z-10 bg-white px-1 text-[10px] font-medium text-slate-500 dark:bg-[#0B1220] dark:text-slate-400">{label}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400">{icon}</span>
      {children}
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
    </label>
  );
}

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-100 dark:focus:ring-blue-500/20";

export default function ApprovalFilters({
  filters,
  emergencyTypeOptions,
  barangayOptions,
  onChange,
  onClear,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-[#1C2940] dark:bg-[#0B1220]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,2fr)_1fr_1fr_1.3fr_1fr_auto] xl:items-center">
        <label className="relative block">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            value={filters.q}
            onChange={(event) => onChange((previous) => ({ ...previous, q: event.target.value }))}
            placeholder="Search by reference no., location, type or keyword..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/20"
          />
        </label>

        <SelectShell icon={<Filter size={15} />} label="Emergency Type">
          <select
            value={filters.emergencyType}
            onChange={(event) => onChange((previous) => ({ ...previous, emergencyType: event.target.value }))}
            className={selectClass}
          >
            {emergencyTypeOptions.map((type) => (
              <option key={type} value={type}>{type === "ALL" ? "All Types" : type}</option>
            ))}
          </select>
        </SelectShell>

        <SelectShell icon={<MapPin size={15} />} label="Location">
          <select
            value={filters.barangay}
            onChange={(event) => onChange((previous) => ({ ...previous, barangay: event.target.value }))}
            className={selectClass}
          >
            {barangayOptions.map((barangay) => (
              <option key={barangay} value={barangay}>{barangay === "ALL" ? "All Barangays" : barangay}</option>
            ))}
          </select>
        </SelectShell>

        <div className="relative grid grid-cols-2 rounded-lg border border-slate-200 bg-white dark:border-[#24324A] dark:bg-[#0E1626]">
          <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" />
          <span className="absolute -top-2 left-3 z-10 bg-white px-1 text-[10px] font-medium text-slate-500 dark:bg-[#0B1220] dark:text-slate-400">Date Range</span>
          <input
            type="date"
            aria-label="Start date"
            value={filters.dateFrom}
            onChange={(event) => onChange((previous) => ({ ...previous, dateFrom: event.target.value }))}
            className="h-11 min-w-0 border-r border-slate-200 bg-white pl-9 pr-1 text-[10px] text-slate-700 outline-none focus:bg-blue-50 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-200 dark:[color-scheme:dark] dark:focus:bg-blue-500/10"
          />
          <input
            type="date"
            aria-label="End date"
            value={filters.dateTo}
            onChange={(event) => onChange((previous) => ({ ...previous, dateTo: event.target.value }))}
            className="h-11 min-w-0 bg-white px-1 text-[10px] text-slate-700 outline-none focus:bg-blue-50 dark:bg-[#0E1626] dark:text-slate-200 dark:[color-scheme:dark] dark:focus:bg-blue-500/10"
          />
        </div>

        <SelectShell icon={<Filter size={15} />} label="Status">
          <select
            value={filters.status}
            onChange={(event) => onChange((previous) => ({ ...previous, status: event.target.value as "ALL" | EmergencyApprovalStatus }))}
            className={selectClass}
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </SelectShell>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          <RotateCcw size={15} />
          Clear Filters
        </button>
      </div>
    </div>
  );
}
