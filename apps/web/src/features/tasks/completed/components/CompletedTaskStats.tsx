import { BadgeCheck, ClipboardCheck, Timer, TrendingUp, type LucideIcon } from "lucide-react";
import type { CompletedTaskStatistics } from "../types/completedTask.types";
import { formatDuration } from "../utils/completedTask.utils";

type Props = { statistics: CompletedTaskStatistics };

type StatItem = {
  label: string;
  value: string;
  support: string;
  icon: LucideIcon;
  iconClassName: string;
};

export default function CompletedTaskStats({ statistics }: Props) {
  const items: StatItem[] = [
    {
      label: "Total Completed",
      value: statistics.totalCompleted.toLocaleString(),
      support: "Verified dispatch records",
      icon: ClipboardCheck,
      iconClassName: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Verified Today",
      value: statistics.verifiedToday.toLocaleString(),
      support: "Based on local date",
      icon: BadgeCheck,
      iconClassName: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
    },
    {
      label: "Average Response Time",
      value: formatDuration(statistics.averageResponseTimeMs),
      support: "Assignment to response",
      icon: Timer,
      iconClassName: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
    {
      label: "Completion Rate",
      value: statistics.completionRate === null ? "—" : `${statistics.completionRate.toFixed(1)}%`,
      support: "Verified of relevant dispatches",
      icon: TrendingUp,
      iconClassName: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    },
  ];

  return (
    <section aria-label="Completed task statistics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClassName}`}>
                <Icon size={21} strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{item.value}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{item.support}</p>
          </article>
        );
      })}
    </section>
  );
}
