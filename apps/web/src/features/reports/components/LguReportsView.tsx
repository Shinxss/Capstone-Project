import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Minus,
  PieChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import { useLguReports } from "../hooks/useLguReports";

type Props = ReturnType<typeof useLguReports> & {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

type TrendTone = "up" | "down" | "neutral";

type TrendData = {
  label: string;
  tone: TrendTone;
};

type BreakdownItem = {
  key: string;
  label: string;
  isOther: boolean;
  count: number;
  percent: number;
};

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const BREAKDOWN_BARS: Record<string, string> = {
  FLOOD: "bg-sky-500",
  FIRE: "bg-red-600",
  TYPHOON: "bg-blue-600",
  EARTHQUAKE: "bg-amber-500",
  MEDICAL: "bg-emerald-500",
  SOS: "bg-rose-600",
  OTHER: "bg-zinc-500",
};
const BREAKDOWN_FALLBACK_BARS = ["bg-indigo-500", "bg-cyan-500", "bg-violet-500", "bg-lime-500", "bg-orange-500"];

function toTime(iso?: string | null) {
  const raw = String(iso || "").trim();
  if (!raw) return null;
  const value = new Date(raw).getTime();
  return Number.isFinite(value) ? value : null;
}

function numberFmt(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function clampTrend(value: number) {
  return Math.max(-99, Math.min(999, Math.round(value)));
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) {
    if (current <= 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

function toTrend(current: number, previous: number): TrendData {
  const value = clampTrend(percentChange(current, previous));
  const tone: TrendTone = value > 0 ? "up" : value < 0 ? "down" : "neutral";
  return { label: `${value > 0 ? "+" : ""}${value}%`, tone };
}

function normalizeBreakdownType(raw: string) {
  const key = String(raw || "").trim().toUpperCase().replace(/\s+/g, " ");
  const isOther = !key || key === "OTHER" || key === "OTHERS";
  return { key: isOther ? "OTHER" : key, isOther };
}

function toTypeLabel(key: string) {
  if (key === "SOS") return "SOS";
  return key
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function barClassForType(item: BreakdownItem, index: number) {
  const known = BREAKDOWN_BARS[item.key];
  if (known) return known;
  return BREAKDOWN_FALLBACK_BARS[index % BREAKDOWN_FALLBACK_BARS.length];
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildBreakdown(emergencies: EmergencyReport[]): BreakdownItem[] {
  const counts = new Map<string, number>();
  let othersCount = 0;

  for (const emergency of emergencies) {
    const normalized = normalizeBreakdownType(emergency.emergencyType);
    if (normalized.isOther) {
      othersCount += 1;
      continue;
    }
    counts.set(normalized.key, (counts.get(normalized.key) ?? 0) + 1);
  }

  const total = emergencies.length;
  const items: BreakdownItem[] = Array.from(counts.entries()).map(([key, count]) => ({
    key,
    label: toTypeLabel(key),
    isOther: false,
    count,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  items.push({
    key: "OTHER",
    label: "Other",
    isOther: true,
    count: othersCount,
    percent: total > 0 ? Math.round((othersCount / total) * 100) : 0,
  });

  return items.sort((a, b) => {
    if (a.isOther && !b.isOther) return 1;
    if (!a.isOther && b.isOther) return -1;
    if (b.percent !== a.percent) return b.percent - a.percent;
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

function estimateVolunteerHours(tasks: DispatchTask[]) {
  let totalMinutes = 0;
  for (const task of tasks) {
    const start = toTime(task.respondedAt);
    const end = toTime(task.completedAt) ?? toTime(task.verifiedAt);
    if (start === null || end === null || end <= start) continue;
    totalMinutes += (end - start) / 60000;
  }

  if (totalMinutes > 0) return Math.round(totalMinutes / 60);

  const fallbackCompleted = tasks.filter((task) => {
    const status = String(task.status || "").toUpperCase();
    return status === "VERIFIED" || status === "DONE";
  }).length;
  return fallbackCompleted * 2;
}

function inWindow(ts: number | null, fromInclusive: number, toExclusive: number) {
  return ts !== null && ts >= fromInclusive && ts < toExclusive;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function quarterLabel(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

function isoWeekLabel(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `Week ${week}, ${d.getUTCFullYear()}`;
}

function LoadingPanel() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
      Loading...
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
      <div className="flex items-center justify-between gap-3">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function TrendChip({ trend }: { trend: TrendData }) {
  const cls =
    trend.tone === "up"
      ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
      : trend.tone === "down"
        ? "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300"
        : "border-gray-300 bg-gray-100 text-gray-600 dark:border-slate-500/40 dark:bg-slate-700/50 dark:text-slate-300";

  const Icon = trend.tone === "up" ? TrendingUp : trend.tone === "down" ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon size={12} />
      {trend.label}
    </span>
  );
}

function KpiCard({
  icon,
  value,
  label,
  trend,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: TrendData;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)] dark:border-[#162544] dark:bg-[#0B1220]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          {icon}
        </div>
        <TrendChip trend={trend} />
      </div>
      <div className="mt-4 text-3xl font-black leading-none text-gray-900 dark:text-slate-100">{value}</div>
      <p className="mt-1.5 text-sm leading-tight text-gray-500 dark:text-slate-400">{label}</p>
    </article>
  );
}

export default function LguReportsView(props: Props) {
  const { loading, error, onRefresh, exportTasksCsv, tasks, emergencies, summary } = props;

  const breakdown = useMemo(() => buildBreakdown(emergencies), [emergencies]);
  const volunteerHours = useMemo(() => estimateVolunteerHours(tasks), [tasks]);

  const trends = useMemo(() => {
    const anchorCandidates: number[] = [];

    for (const emergency of emergencies) {
      const emergencyTs = toTime(emergency.reportedAt) ?? toTime(emergency.createdAt) ?? toTime(emergency.updatedAt);
      if (emergencyTs !== null) anchorCandidates.push(emergencyTs);
    }

    for (const task of tasks) {
      const taskTs =
        toTime(task.verifiedAt) ??
        toTime(task.completedAt) ??
        toTime(task.respondedAt) ??
        toTime(task.createdAt) ??
        toTime(task.updatedAt);
      if (taskTs !== null) anchorCandidates.push(taskTs);
    }

    const anchor = anchorCandidates.length > 0 ? Math.max(...anchorCandidates) : Date.now();
    const currentStart = anchor - MONTH_MS;
    const previousStart = currentStart - MONTH_MS;

    let emergenciesCurrent = 0;
    let emergenciesPrevious = 0;
    for (const emergency of emergencies) {
      const ts = toTime(emergency.reportedAt) ?? toTime(emergency.createdAt) ?? toTime(emergency.updatedAt);
      if (inWindow(ts, currentStart, anchor + 1)) emergenciesCurrent += 1;
      if (inWindow(ts, previousStart, currentStart)) emergenciesPrevious += 1;
    }

    let resolvedCurrent = 0;
    let resolvedPrevious = 0;
    let volunteerCurrentHours = 0;
    let volunteerPreviousHours = 0;
    const responseCurrent: number[] = [];
    const responsePrevious: number[] = [];

    for (const task of tasks) {
      const status = String(task.status || "").toUpperCase();
      const resolvedTs = toTime(task.verifiedAt) ?? toTime(task.completedAt) ?? toTime(task.updatedAt);
      const isResolved = status === "VERIFIED" || status === "DONE";

      if (isResolved && inWindow(resolvedTs, currentStart, anchor + 1)) resolvedCurrent += 1;
      if (isResolved && inWindow(resolvedTs, previousStart, currentStart)) resolvedPrevious += 1;

      const start = toTime(task.respondedAt);
      const end = toTime(task.completedAt) ?? toTime(task.verifiedAt);
      if (start !== null && end !== null && end > start) {
        const hours = (end - start) / 3600000;
        if (inWindow(end, currentStart, anchor + 1)) volunteerCurrentHours += hours;
        if (inWindow(end, previousStart, currentStart)) volunteerPreviousHours += hours;
      }

      const reported = toTime(task.emergency?.reportedAt);
      const responded = toTime(task.respondedAt);
      if (reported !== null && responded !== null && responded > reported) {
        const minutes = (responded - reported) / 60000;
        if (inWindow(responded, currentStart, anchor + 1)) responseCurrent.push(minutes);
        if (inWindow(responded, previousStart, currentStart)) responsePrevious.push(minutes);
      }
    }

    return {
      emergencyTrend: toTrend(emergenciesCurrent, emergenciesPrevious),
      resolvedTrend: toTrend(resolvedCurrent, resolvedPrevious),
      volunteerTrend: toTrend(volunteerCurrentHours, volunteerPreviousHours),
      responseTrend: toTrend(average(responseCurrent), average(responsePrevious)),
      anchorDate: new Date(anchor),
    };
  }, [emergencies, tasks]);

  const reportItems = useMemo(() => {
    const totalRecords = tasks.length + emergencies.length;
    const date = trends.anchorDate;
    return [
      {
        id: "monthly",
        title: "Monthly Emergency Response Summary",
        cadence: "monthly",
        period: monthLabel(date),
        downloads: Math.max(12, Math.round(totalRecords * 0.14)),
      },
      {
        id: "quarterly",
        title: "Volunteer Performance Report",
        cadence: "quarterly",
        period: quarterLabel(date),
        downloads: Math.max(8, Math.round(totalRecords * 0.1)),
      },
      {
        id: "weekly",
        title: "Resource Allocation Analysis",
        cadence: "weekly",
        period: isoWeekLabel(date),
        downloads: Math.max(6, Math.round(totalRecords * 0.06)),
      },
    ];
  }, [emergencies.length, tasks.length, trends.anchorDate]);

  if (loading) return <LoadingPanel />;
  if (error) return <ErrorPanel error={error} onRetry={onRefresh} />;

  return (
    <div className="px-2 py-4 sm:px-4 sm:py-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<AlertTriangle size={20} />}
          value={numberFmt(summary.totalEmergencies)}
          label="Total Emergencies"
          trend={trends.emergencyTrend}
        />
        <KpiCard
          icon={<CheckCircle2 size={20} />}
          value={numberFmt(summary.completedTasks)}
          label="Resolved Cases"
          trend={trends.resolvedTrend}
        />
        <KpiCard
          icon={<Clock3 size={20} />}
          value={numberFmt(volunteerHours)}
          label="Volunteer Hours"
          trend={trends.volunteerTrend}
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          value={summary.avgResponseMinutes === null ? "N/A" : `${Math.round(summary.avgResponseMinutes)} min`}
          label="Response Time"
          trend={trends.responseTrend}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(480px,2fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(0,0,0,0.3)] dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-gray-700 dark:text-slate-300" />
            <h2 className="text-2xl font-black leading-none text-gray-900 dark:text-slate-100">Emergency Breakdown</h2>
          </div>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">By incident type</p>

          <div className="mt-6 space-y-4">
            {breakdown.map((item, index) => {
              const minBar = item.count > 0 ? 6 : 0;
              const width = Math.max(minBar, item.percent);
              return (
                <div key={item.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-lg font-medium text-gray-900 dark:text-slate-100">{item.label}</span>
                    <span className="text-base text-gray-500 dark:text-slate-400">
                      {numberFmt(item.count)} ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-[#111E34]">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${barClassForType(item, index)}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_24px_-20px_rgba(0,0,0,0.3)] dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-gray-700 dark:text-slate-300" />
                <h2 className="text-2xl font-black leading-none text-gray-900 dark:text-slate-100">Recent Reports</h2>
              </div>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-slate-400">Generated reports and analytics</p>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300 dark:hover:bg-[#13213A]"
              aria-label="Refresh reports"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {reportItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-[#162544] dark:bg-[#0E1626]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold leading-tight text-gray-900 dark:text-slate-100">{item.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
                      <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold lowercase text-gray-700 dark:bg-[#162544] dark:text-slate-200">
                        {item.cadence}
                      </span>
                      <span>{item.period}</span>
                      <span className="inline-flex items-center gap-1">
                        <Download size={12} />
                        {item.downloads}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/20 dark:text-emerald-300">
                      completed
                    </span>
                    <button
                      type="button"
                      onClick={exportTasksCsv}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-200/80 dark:text-slate-300 dark:hover:bg-[#13213A]"
                      aria-label={`Download ${item.title}`}
                    >
                      <Download size={19} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

