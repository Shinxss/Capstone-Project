import { AlertTriangle, CheckCircle2, Clock3, Minus, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import type { ReportMetric } from "../models/reports.types";

const metricStyles = {
  total: { Icon: AlertTriangle, icon: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" },
  responded: { Icon: CheckCircle2, icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
  unresolved: { Icon: Clock3, icon: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" },
  responseTime: { Icon: Zap, icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300" },
  volunteerHours: { Icon: Users, icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
};

export default function ReportMetricCard({ metric }: { metric: ReportMetric }) {
  const { Icon, icon } = metricStyles[metric.key];
  const trend = metric.trend;
  const valLength = metric.value.length;
  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendClass = trend?.isPositive === true
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : trend?.isPositive === false
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300";

  return (
    <article className="min-h-[122px] min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${icon}`}><Icon size={22} /></div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400" title={metric.label}>
            {metric.label}
          </p>
          <p
            className={`mt-1 truncate font-black leading-tight tracking-tight text-slate-950 dark:text-slate-100 ${
              valLength > 10
                ? "text-[18px] 2xl:text-[20px]"
                : valLength > 6
                  ? "text-[20px] 2xl:text-[22px]"
                  : "text-[24px] xl:text-[26px] 2xl:text-[28px]"
            }`}
            title={metric.tooltip ?? metric.value}
          >
            {metric.value}
          </p>
          {trend ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${trendClass}`}><TrendIcon size={11} />{trend.label}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">vs. previous period</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
