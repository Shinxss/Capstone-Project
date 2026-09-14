import { PieChart } from "lucide-react";
import { EMERGENCY_COLORS, EMPTY_REPORT_MESSAGE, FALLBACK_EMERGENCY_COLORS } from "../constants/reports.constants";
import type { EmergencyBreakdownItem } from "../models/reports.types";

function itemColor(item: EmergencyBreakdownItem, index: number) {
  return EMERGENCY_COLORS[item.key] ?? FALLBACK_EMERGENCY_COLORS[index % FALLBACK_EMERGENCY_COLORS.length] ?? "#94A3B8";
}

export default function EmergencyBreakdownCard({ items }: { items: EmergencyBreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const segments = items.map((item, index) => ({
    item,
    index,
    length: circumference * (total ? item.count / total : 0),
    offset: circumference * (total ? items.slice(0, index).reduce((sum, previous) => sum + previous.count, 0) / total : 0),
  }));
  return (
    <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5"><PieChart size={20} className="mt-0.5 text-rose-600" /><div><h2 className="text-[17px] font-bold leading-tight text-slate-950 dark:text-slate-100">Emergency Breakdown</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Incidents by emergency type</p></div></div>
        <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-[#162544] dark:text-slate-300">This Month</span>
      </div>
      {items.length ? (
        <div className="mt-3 grid items-center gap-5 sm:grid-cols-[190px_1fr]">
          <div className="relative mx-auto h-40 w-40">
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="19" className="text-slate-100 dark:text-slate-800" />
              {segments.map(({ item, index, length, offset: segmentOffset }) => <circle key={item.key} cx="64" cy="64" r={radius} fill="none" stroke={itemColor(item, index)} strokeWidth="19" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-segmentOffset} />)}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl font-black text-slate-950 dark:text-slate-100">{total}</strong><span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">Total</span><span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">Incidents</span></div>
          </div>
          <div className="space-y-2.5">
            {items.map((item, index) => {
              const color = itemColor(item, index);
              return <div key={item.key} className="grid grid-cols-[105px_1fr_62px] items-center gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 font-medium text-slate-700 dark:text-slate-200"><i className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} /><span className="truncate">{item.label}</span></span><span className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><i className="block h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: color }} /></span><span className="text-right text-slate-500 dark:text-slate-400">{item.count} ({item.percent}%)</span></div>;
            })}
          </div>
        </div>
      ) : <div className="flex h-[175px] items-center justify-center text-sm text-slate-400">{EMPTY_REPORT_MESSAGE}</div>}
    </article>
  );
}
