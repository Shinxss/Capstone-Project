import { MapPin } from "lucide-react";
import type { AffectedAreaItem } from "../models/reports.types";

const ranks = [
  "bg-rose-500 text-white",
  "bg-blue-500 text-white",
  "bg-amber-500 text-white",
  "bg-slate-400 text-white",
  "bg-slate-400 text-white",
  "bg-slate-400 text-white",
];
const bars = ["bg-rose-500", "bg-blue-500", "bg-amber-500", "bg-slate-300", "bg-slate-300", "bg-slate-300"];

export default function MostAffectedAreasCard({ items }: { items: AffectedAreaItem[] }) {
  return (
    <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5"><MapPin size={20} className="mt-0.5 text-rose-600" fill="currentColor" /><div><h2 className="text-[17px] font-bold leading-tight text-slate-950 dark:text-slate-100">Most Affected Areas</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Areas with the highest number of incidents</p></div></div>
        <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-[#162544] dark:text-slate-300">This Month</span>
      </div>
      {items.length ? (
        <div className="mt-3 space-y-1.5">
          {items.map((item, index) => <div key={item.label} className="grid grid-cols-[28px_minmax(80px,140px)_28px_1fr] items-center gap-2 rounded-lg px-1.5 py-1 text-xs transition hover:bg-slate-50 dark:hover:bg-slate-800/30"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${ranks[index]}`}>{index + 1}</span><span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.label}</span><span className="text-center font-semibold text-slate-500 dark:text-slate-400">{item.count}</span><span className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><i className={`block h-full rounded-full ${bars[index]}`} style={{ width: `${item.percentOfMax}%` }} /></span></div>)}
        </div>
      ) : <div className="flex h-[175px] items-center justify-center text-center text-sm text-slate-400">No detailed area data available for this period.</div>}
    </article>
  );
}
