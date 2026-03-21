import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Minus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DashboardStatCardItem,
  DashboardTrendDirection,
  DashboardTrendTone,
} from "../models/lguDashboard.types";

const ICON_BY_KEY: Record<DashboardStatCardItem["key"], LucideIcon> = {
  activeEmergencies: AlertTriangle,
  availableVolunteers: Users,
  tasksInProgress: ClipboardList,
  responseRate: Activity,
};

const ICON_TILE_TONE_CLASS: Record<DashboardStatCardItem["key"], string> = {
  activeEmergencies:
    "border border-red-200 bg-red-50 text-red-600 dark:border-red-400/35 dark:bg-red-500/15 dark:text-red-300",
  availableVolunteers:
    "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-300",
  tasksInProgress:
    "border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/35 dark:bg-amber-500/15 dark:text-amber-300",
  responseRate:
    "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/35 dark:bg-blue-500/15 dark:text-blue-300",
};

const TREND_PILL_CLASS: Record<DashboardTrendTone, string> = {
  good: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/35",
  bad: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/35",
  neutral:
    "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/15",
};

const TREND_ICON_BY_DIRECTION: Record<DashboardTrendDirection, LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
};

export default function DashboardStatCard({ item }: { item: DashboardStatCardItem }) {
  const StatIcon = ICON_BY_KEY[item.key];
  const TrendIcon = TREND_ICON_BY_DIRECTION[item.trend.direction];

  return (
    <article className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)] dark:border-[#1B2A48] dark:bg-[#0E1626] dark:shadow-black/35">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
            ICON_TILE_TONE_CLASS[item.key]
          )}
          aria-hidden="true"
        >
          <StatIcon size={20} strokeWidth={2.3} />
        </span>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            TREND_PILL_CLASS[item.trend.tone]
          )}
          title={item.trend.comparisonLabel}
        >
          <TrendIcon size={13} strokeWidth={2.5} />
          {item.trend.display}
        </span>
      </div>

      <p className="mt-7 text-4xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
        {item.valueDisplay}
      </p>
      <p className="mt-2 text-sm font-medium text-gray-500 dark:text-slate-400">{item.label}</p>
    </article>
  );
}
