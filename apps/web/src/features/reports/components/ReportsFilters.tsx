import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { CalendarDays, ChevronDown, Download } from "lucide-react";
import type { ReportsFilters as ReportsFilterValues } from "../models/reports.types";

type Props = {
  filters: ReportsFilterValues;
  setFilters: Dispatch<SetStateAction<ReportsFilterValues>>;
  clearFilters: () => void;
  emergencyTypeOptions: string[];
  statusOptions: string[];
  onExport: () => void;
};

function selectLabel(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(filters: ReportsFilterValues) {
  const format = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (filters.dateFrom && filters.dateTo) return `${format(filters.dateFrom)} – ${format(filters.dateTo)}`;
  if (filters.dateFrom) return `From ${format(filters.dateFrom)}`;
  if (filters.dateTo) return `Through ${format(filters.dateTo)}`;
  return "All Dates";
}

export default function ReportsFilters({ filters, setFilters, clearFilters, emergencyTypeOptions, statusOptions, onExport }: Props) {
  const [dateOpen, setDateOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(filters.dateFrom);
  const [draftTo, setDraftTo] = useState(filters.dateTo);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dateOpen) return;
    const close = (event: MouseEvent) => {
      if (!dateRef.current?.contains(event.target as Node)) setDateOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [dateOpen]);

  const fieldClass = "h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-200 dark:focus:ring-red-500/15";

  return (
    <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 2xl:w-auto 2xl:shrink-0 2xl:flex-nowrap">
      <div ref={dateRef} className="relative min-w-0 flex-1 sm:min-w-[230px] 2xl:flex-none">
        <button
          type="button"
          onClick={() => {
            setDraftFrom(filters.dateFrom);
            setDraftTo(filters.dateTo);
            setDateOpen((open) => !open);
          }}
          className={`${fieldClass} flex w-full min-w-0 items-center gap-2 text-left sm:min-w-[230px]`}
        >
          <CalendarDays size={16} className="shrink-0 text-slate-600 dark:text-slate-300" />
          <span className="min-w-0 flex-1 truncate">{dateLabel(filters)}</span>
          <ChevronDown size={14} className="shrink-0" />
        </button>

        {dateOpen ? (
          <div className="absolute right-0 z-30 mt-2 w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                From
                <input type="date" value={draftFrom} max={draftTo || undefined} onChange={(event) => setDraftFrom(event.target.value)} className={`${fieldClass} mt-1.5 w-full px-2`} />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                To
                <input type="date" value={draftTo} min={draftFrom || undefined} onChange={(event) => setDraftTo(event.target.value)} className={`${fieldClass} mt-1.5 w-full px-2`} />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setDraftFrom("");
                  setDraftTo("");
                  setDateOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters((current) => ({ ...current, dateFrom: draftFrom, dateTo: draftTo }));
                  setDateOpen(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Apply
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <select value={filters.emergencyType} onChange={(event) => setFilters((current) => ({ ...current, emergencyType: event.target.value }))} className={`${fieldClass} min-w-[165px] flex-1 2xl:flex-none`} aria-label="Emergency type">
        {emergencyTypeOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All Emergency Types" : selectLabel(option)}</option>)}
      </select>
      <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={`${fieldClass} min-w-[140px] flex-1 2xl:flex-none`} aria-label="Emergency status">
        {statusOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "All Statuses" : selectLabel(option)}</option>)}
      </select>
      <button type="button" onClick={onExport} className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-red-700">
        <Download size={16} />
        Export Report
      </button>
    </div>
  );
}
