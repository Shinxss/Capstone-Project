import { Search, Users } from "lucide-react";
import type { AnnouncementFilters, AnnouncementStatusFilter } from "../models/announcements.types";
import { parseAudience, parseStatusFilter } from "../utils/announcementDashboard.utils";

type Props = { filters: AnnouncementFilters; onChange: <K extends keyof AnnouncementFilters>(key: K, value: AnnouncementFilters[K]) => void };

const tabs: ReadonlyArray<{ value: AnnouncementStatusFilter; label: string }> = [
  { value: "ALL", label: "All" }, { value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Drafts" }, { value: "SCHEDULED", label: "Scheduled" }, { value: "ARCHIVED", label: "Archived" },
];

export default function AnnouncementToolbar({ filters, onChange }: Props) {
  return (
    <section aria-label="Announcement filters" className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220] xl:flex-row xl:items-center xl:justify-between">
      <div role="tablist" aria-label="Announcement status" className="flex min-w-0 overflow-x-auto px-1">
        {tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={filters.status === tab.value} onClick={() => onChange("status", parseStatusFilter(tab.value))} className={`relative inline-flex h-11 shrink-0 items-center px-3 text-xs font-bold transition focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:px-4 ${filters.status === tab.value ? "text-red-600 dark:text-red-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}>{tab.label}{filters.status === tab.value ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-red-600" /> : null}</button>)}
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,1fr)_180px] xl:w-[560px] xl:shrink-0">
        <label className="relative block"><span className="sr-only">Search announcements</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Search announcements..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-white dark:focus:ring-red-500/15" /></label>
        <label className="relative block"><span className="sr-only">Filter by audience</span><Users size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><select value={filters.audience} onChange={(event) => onChange("audience", parseAudience(event.target.value))} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#24324A] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:ring-red-500/15"><option value="">Audience: All</option><option value="ALL">Everyone</option><option value="VOLUNTEER">Volunteers</option><option value="LGU">LGU Officials</option><option value="PUBLIC">Community Members</option></select></label>
      </div>
    </section>
  );
}
