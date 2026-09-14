import { AlertTriangle, BarChart3, CheckCircle2, Hourglass, Zap } from "lucide-react";
import type { ResponsePerformance } from "../models/reports.types";
import { formatResponseDuration } from "../utils/reports.utils";

export default function ResponsePerformanceCard({ performance, barangayName }: { performance: ResponsePerformance; barangayName: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const metrics = [
    { label: "Fastest Response", value: formatResponseDuration(performance.fastestResponseMinutes), Icon: Zap, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: "Slowest Response", value: formatResponseDuration(performance.slowestResponseMinutes), Icon: Hourglass, tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
    { label: "Resolved Incidents", value: `${performance.resolved} (${performance.resolvedRate}%)`, Icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: "Unresolved Incidents", value: `${performance.unresolved} (${performance.unresolvedRate}%)`, Icon: AlertTriangle, tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
  ];
  return (
    <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5"><BarChart3 size={20} className="mt-0.5 text-rose-600" /><div><h2 className="text-[17px] font-bold leading-tight text-slate-950 dark:text-slate-100">Response Performance</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Key response metrics for {barangayName}</p></div></div>
        <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-[#162544] dark:text-slate-300">This Month</span>
      </div>
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90"><circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="13" className="text-slate-100 dark:text-slate-800" /><circle cx="64" cy="64" r={radius} fill="none" stroke="#10B981" strokeWidth="13" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - performance.responseRate / 100)} /></svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-3xl font-black text-slate-950 dark:text-slate-100">{performance.responseRate}%</strong><span className="text-[11px] text-slate-500 dark:text-slate-400">Response Rate</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map(({ label, value, Icon, tone }) => <div key={label} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 dark:border-[#162544] dark:bg-[#0E1626]"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></div><div className="min-w-0"><p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{label}</p><p className="mt-0.5 truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">{value}</p></div></div>)}
        </div>
      </div>
      <div className="mt-3"><div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">{performance.total ? <><div className="bg-emerald-500" style={{ width: `${performance.resolvedRate}%` }} /><div className="bg-rose-500" style={{ width: `${performance.unresolvedRate}%` }} /></> : null}</div><div className="mt-2 flex justify-center gap-5 text-[11px] text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Resolved ({performance.resolved})</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />Unresolved ({performance.unresolved})</span></div></div>
    </article>
  );
}
