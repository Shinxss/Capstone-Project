import { AlertTriangle, Clock3, Lightbulb, MapPin } from "lucide-react";
import type { ReportInsight } from "../models/reports.types";

const styles = {
  danger: { Icon: AlertTriangle, className: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
  warning: { Icon: MapPin, className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
  info: { Icon: Clock3, className: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" },
  success: { Icon: Clock3, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
};

export default function ReportsInsightsCard({ insights }: { insights: ReportInsight[] }) {
  return (
    <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2.5"><Lightbulb size={20} className="mt-0.5 text-rose-600" /><div><h2 className="text-[17px] font-bold leading-tight text-slate-950 dark:text-slate-100">Key Insights</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Automatically derived from current report data</p></div></div><span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-[#162544] dark:text-slate-300">This Month</span></div>
      <div className="mt-3 space-y-2">
        {insights.map((insight) => {
          const { Icon, className } = styles[insight.tone];
          return <div key={insight.id} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${className}`}><Icon size={20} className="mt-0.5 shrink-0" /><div><p className="text-xs font-bold leading-snug text-slate-800 dark:text-slate-100">{insight.title}</p><p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{insight.description}</p></div></div>;
        })}
      </div>
    </article>
  );
}
