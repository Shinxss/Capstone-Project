import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import type {
  AffectedAreaItem,
  EmergencyBreakdownItem,
  GeneratedReport,
  IncidentTrendPoint,
  ReportInsight,
  ReportMetric,
  ReportsDashboard,
  ReportsFilters,
  ResponsePerformance,
} from "../models/reports.types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toTime(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function emergencyTime(emergency: EmergencyReport) {
  return toTime(emergency.reportedAt) ?? toTime(emergency.createdAt) ?? toTime(emergency.updatedAt);
}

function startOfDay(value: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() : null;
}

function endOfDay(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).getTime() : null;
}

function normalized(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatResponseDuration(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) return "N/A";
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} min`;
  const totalHours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  return `${totalHours}h${remainingMinutes ? ` ${remainingMinutes}m` : ""}`;
}

export function formatDetailedResponseDuration(minutes: number | null): string | undefined {
  if (minutes === null || !Number.isFinite(minutes)) return undefined;
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} minute${rounded === 1 ? "" : "s"}`;
  const totalHours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;
    return `${days} day${days === 1 ? "" : "s"} ${remHours} hr${remHours === 1 ? "" : "s"}${remainingMinutes ? ` ${remainingMinutes} min` : ""} (${totalHours} hrs ${remainingMinutes} min)`;
  }
  return `${totalHours} hr${totalHours === 1 ? "" : "s"}${remainingMinutes ? ` ${remainingMinutes} min` : ""}`;
}

export function extractAreaLabel(locationLabel?: string) {
  const value = String(locationLabel || "").trim();
  if (!value) return "Other Areas";
  const purokMatch = value.match(/\bpurok\s+([^,;|]+)/i);
  if (purokMatch?.[1]) return `Purok ${purokMatch[1].trim()}`;
  const firstSegment = value.split(",")[0]?.trim();
  return firstSegment && firstSegment.length > 1 ? firstSegment : "Other Areas";
}

export function filterEmergencies(emergencies: EmergencyReport[], filters: ReportsFilters) {
  const from = startOfDay(filters.dateFrom);
  const to = endOfDay(filters.dateTo);
  return emergencies.filter((emergency) => {
    const timestamp = emergencyTime(emergency);
    if (from !== null && (timestamp === null || timestamp < from)) return false;
    if (to !== null && (timestamp === null || timestamp > to)) return false;
    if (filters.emergencyType !== "ALL" && emergency.emergencyType !== filters.emergencyType) return false;
    if (filters.status !== "ALL" && normalized(emergency.status) !== normalized(filters.status)) return false;
    return true;
  });
}

export function filterTasks(
  tasks: DispatchTask[],
  emergencies: EmergencyReport[],
  filteredEmergencies: EmergencyReport[],
  filters: ReportsFilters,
) {
  const knownIds = new Set(emergencies.map((item) => item._id));
  const allowedIds = new Set(filteredEmergencies.map((item) => item._id));
  const from = startOfDay(filters.dateFrom);
  const to = endOfDay(filters.dateTo);

  return tasks.filter((task) => {
    const emergencyId = task.emergency?.id;
    if (emergencyId && knownIds.has(emergencyId)) return allowedIds.has(emergencyId);

    const timestamp = toTime(task.emergency?.reportedAt) ?? toTime(task.createdAt) ?? toTime(task.updatedAt);
    if (from !== null && (timestamp === null || timestamp < from)) return false;
    if (to !== null && (timestamp === null || timestamp > to)) return false;
    if (filters.emergencyType !== "ALL" && task.emergency?.emergencyType !== filters.emergencyType) return false;
    if (filters.status !== "ALL" && normalized(task.emergency?.status) !== normalized(filters.status)) return false;
    return true;
  });
}

function normalizeType(value: string) {
  const key = normalized(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return !key || key === "OTHERS" ? "OTHER" : key;
}

function typeLabel(key: string) {
  if (key === "SOS") return key;
  return key.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildEmergencyBreakdown(emergencies: EmergencyReport[]): EmergencyBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const emergency of emergencies) {
    const key = normalizeType(emergency.emergencyType);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = emergencies.length;
  return Array.from(counts, ([key, count]) => ({
    key,
    label: typeLabel(key),
    count,
    percent: total ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => {
    if (a.key === "OTHER") return 1;
    if (b.key === "OTHER") return -1;
    return b.count - a.count || a.label.localeCompare(b.label);
  });
}

export function buildAffectedAreas(emergencies: EmergencyReport[]): AffectedAreaItem[] {
  const counts = new Map<string, number>();
  for (const emergency of emergencies) {
    const area = extractAreaLabel(emergency.locationLabel);
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  const entries = Array.from(counts, ([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
  if (entries.length === 1 && entries[0]?.label === "Other Areas") return [];
  const max = entries[0]?.count ?? 0;
  return entries.map((item) => ({ ...item, percentOfMax: max ? (item.count / max) * 100 : 0 }));
}

function responseMinutes(tasks: DispatchTask[]) {
  return tasks.flatMap((task) => {
    const reported = toTime(task.emergency?.reportedAt);
    const responded = toTime(task.respondedAt);
    if (reported === null || responded === null || responded < reported) return [];
    return [(responded - reported) / 60000];
  });
}

function uniqueEmergencyIds(tasks: DispatchTask[], predicate: (task: DispatchTask) => boolean) {
  return new Set(tasks.filter(predicate).map((task) => task.emergency?.id).filter(Boolean)).size;
}

export function buildResponsePerformance(emergencies: EmergencyReport[], tasks: DispatchTask[]): ResponsePerformance {
  const total = emergencies.length;
  const responded = uniqueEmergencyIds(tasks, (task) => {
    const status = normalized(task.status);
    return Boolean(task.respondedAt) || ["ACCEPTED", "DONE", "VERIFIED"].includes(status);
  });
  const taskResolvedIds = new Set(
    tasks.filter((task) => ["DONE", "VERIFIED"].includes(normalized(task.status))).map((task) => task.emergency?.id),
  );
  const resolved = emergencies.filter((emergency) => {
    const status = normalized(emergency.status);
    return (
      taskResolvedIds.has(emergency._id) ||
      normalized(emergency.progressLabel) === "RESOLVED" ||
      ["RESOLVED", "COMPLETED", "DONE", "VERIFIED"].includes(status)
    );
  }).length;
  const unresolved = Math.max(total - resolved, 0);
  const times = responseMinutes(tasks);
  const averageResponseMinutes = times.length ? times.reduce((sum, value) => sum + value, 0) / times.length : null;
  return {
    total,
    responded: Math.min(responded, total),
    resolved,
    unresolved,
    responseRate: total ? Math.round((Math.min(responded, total) / total) * 100) : 0,
    resolvedRate: total ? Math.round((resolved / total) * 100) : 0,
    unresolvedRate: total ? Math.round((unresolved / total) * 100) : 0,
    averageResponseMinutes,
    fastestResponseMinutes: times.length ? Math.min(...times) : null,
    slowestResponseMinutes: times.length ? Math.max(...times) : null,
  };
}

export function estimateVolunteerHours(tasks: DispatchTask[]) {
  let minutes = 0;
  for (const task of tasks) {
    const start = toTime(task.respondedAt);
    const end = toTime(task.completedAt) ?? toTime(task.verifiedAt);
    if (start !== null && end !== null && end > start) minutes += (end - start) / 60000;
  }
  if (minutes > 0) return Math.round(minutes / 60);
  return tasks.filter((task) => ["DONE", "VERIFIED"].includes(normalized(task.status))).length * 2;
}

function trend(current: number | null, previous: number | null, lowerIsBetter = false) {
  if (current === null || previous === null || (current === 0 && previous === 0)) {
    return { value: 0, direction: "neutral" as const, label: "0%", isPositive: undefined };
  }
  const change = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const value = Math.max(-999, Math.min(999, Math.round(change)));
  return {
    value,
    direction: value > 0 ? ("up" as const) : value < 0 ? ("down" as const) : ("neutral" as const),
    label: `${value > 0 ? "+" : ""}${value}%`,
    isPositive: value === 0 ? undefined : lowerIsBetter ? value < 0 : value > 0,
  };
}

function comparisonWindow(allEmergencies: EmergencyReport[], filters: ReportsFilters) {
  const timestamps = allEmergencies.map(emergencyTime).filter((value): value is number => value !== null);
  const anchor = endOfDay(filters.dateTo) ?? (timestamps.length ? Math.max(...timestamps) : Date.now());
  const currentStart = startOfDay(filters.dateFrom) ?? anchor - 30 * DAY_MS;
  const span = Math.max(DAY_MS, anchor - currentStart + 1);
  return { anchor, currentStart, previousStart: currentStart - span };
}

function sameNonDateFilters(emergency: EmergencyReport, filters: ReportsFilters) {
  return (
    (filters.emergencyType === "ALL" || emergency.emergencyType === filters.emergencyType) &&
    (filters.status === "ALL" || normalized(emergency.status) === normalized(filters.status))
  );
}

function datasetsForWindow(
  allEmergencies: EmergencyReport[],
  allTasks: DispatchTask[],
  filters: ReportsFilters,
  from: number,
  to: number,
) {
  const emergencies = allEmergencies.filter((item) => {
    const timestamp = emergencyTime(item);
    return timestamp !== null && timestamp >= from && timestamp < to && sameNonDateFilters(item, filters);
  });
  const ids = new Set(emergencies.map((item) => item._id));
  const tasks = allTasks.filter((task) => ids.has(task.emergency?.id));
  return { emergencies, tasks };
}

export function buildIncidentTrend(emergencies: EmergencyReport[], anchorTimestamp?: number): IncidentTrendPoint[] {
  if (!emergencies.length) return [];
  const timestamps = emergencies.map(emergencyTime).filter((value): value is number => value !== null);
  const anchor = new Date(anchorTimestamp ?? (timestamps.length ? Math.max(...timestamps) : Date.now()));
  const points: IncidentTrendPoint[] = [];
  for (let offset = 8; offset >= 0; offset -= 1) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    points.push({ key, label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }), count: 0 });
  }
  const byKey = new Map(points.map((point) => [point.key, point]));
  for (const emergency of emergencies) {
    const timestamp = emergencyTime(emergency);
    if (timestamp === null) continue;
    const date = new Date(timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const point = byKey.get(key);
    if (point) point.count += 1;
  }
  return points;
}

function generatedReports(anchor: number): GeneratedReport[] {
  const date = new Date(anchor);
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const midMonth = new Date(date.getFullYear(), date.getMonth(), Math.max(1, Math.min(15, date.getDate())));
  const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return [
    { id: "monthly-response", name: "Monthly Emergency Response Summary", type: "Monthly", generatedOn: dateLabel, status: "completed" },
    { id: "volunteer-performance", name: "Volunteer Performance Report", type: "Quarterly", generatedOn: midMonth.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), status: "completed" },
    { id: "incident-resolution", name: "Incident Resolution Summary", type: "Monthly", generatedOn: startMonth.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), status: "completed" },
  ];
}

function buildInsights(
  barangayName: string,
  total: number,
  breakdown: EmergencyBreakdownItem[],
  areas: AffectedAreaItem[],
  currentAverage: number | null,
  previousAverage: number | null,
): ReportInsight[] {
  if (!total) {
    return [{ id: "empty", title: "Not enough data is available to generate insights for this period.", description: "Try adjusting or clearing the selected filters.", tone: "info" }];
  }
  const topType = breakdown[0];
  const topArea = areas[0];
  const responseComparison = trend(currentAverage, previousAverage, true);
  let responseTitle = "More response data is needed to measure period-over-period performance.";
  let responseDescription = "Response time will appear once valid report and response timestamps are available.";
  if (currentAverage !== null && previousAverage !== null) {
    responseTitle = responseComparison.value <= 0
      ? `Average response time improved by ${Math.abs(responseComparison.value)}%.`
      : `Average response time increased by ${responseComparison.value}%.`;
    responseDescription = `From ${formatResponseDuration(previousAverage)} in the previous period to ${formatResponseDuration(currentAverage)} in the current period.`;
  }
  return [
    {
      id: "top-type",
      title: `${topType?.label ?? "Emergency activity"} remains the most reported incident this period.`,
      description: `${topType?.label ?? "This category"} accounts for ${topType?.percent ?? 0}% of all incidents in ${barangayName}.`,
      tone: "danger",
    },
    topArea
      ? {
          id: "top-area",
          title: `${topArea.label} has the highest incident concentration.`,
          description: `${topArea.count} incidents were recorded in this area during the selected period.`,
          tone: "warning",
        }
      : {
          id: "top-area",
          title: "Detailed area data is unavailable for this period.",
          description: "Incident locations do not include a usable Purok or sub-area label.",
          tone: "warning",
        },
    { id: "response", title: responseTitle, description: responseDescription, tone: "info" },
  ];
}

export function buildReportsDashboard(args: {
  allEmergencies: EmergencyReport[];
  allTasks: DispatchTask[];
  emergencies: EmergencyReport[];
  tasks: DispatchTask[];
  filters: ReportsFilters;
  barangayName: string;
}): ReportsDashboard {
  const { allEmergencies, allTasks, emergencies, tasks, filters, barangayName } = args;
  const { anchor, currentStart, previousStart } = comparisonWindow(allEmergencies, filters);
  const currentPeriod = datasetsForWindow(allEmergencies, allTasks, filters, currentStart, anchor + 1);
  const previousPeriod = datasetsForWindow(allEmergencies, allTasks, filters, previousStart, currentStart);
  const performance = buildResponsePerformance(emergencies, tasks);
  const currentPerformance = buildResponsePerformance(currentPeriod.emergencies, currentPeriod.tasks);
  const previousPerformance = buildResponsePerformance(previousPeriod.emergencies, previousPeriod.tasks);
  const volunteerHours = estimateVolunteerHours(tasks);
  const metrics: ReportMetric[] = [
    { key: "total", label: "Total Incidents", value: formatNumber(emergencies.length), trend: trend(currentPeriod.emergencies.length, previousPeriod.emergencies.length) },
    { key: "responded", label: "Responded Incidents", value: formatNumber(performance.responded), trend: trend(currentPerformance.responded, previousPerformance.responded) },
    { key: "unresolved", label: "Unresolved Incidents", value: formatNumber(performance.unresolved), trend: { ...trend(currentPerformance.unresolved, previousPerformance.unresolved, true), isPositive: currentPerformance.unresolved === previousPerformance.unresolved ? undefined : currentPerformance.unresolved < previousPerformance.unresolved } },
    {
      key: "responseTime",
      label: "Avg Response Time",
      value: formatResponseDuration(performance.averageResponseMinutes),
      trend: trend(currentPerformance.averageResponseMinutes, previousPerformance.averageResponseMinutes, true),
      tooltip: formatDetailedResponseDuration(performance.averageResponseMinutes),
    },
    { key: "volunteerHours", label: "Volunteer Hours", value: formatNumber(volunteerHours), trend: trend(estimateVolunteerHours(currentPeriod.tasks), estimateVolunteerHours(previousPeriod.tasks)) },
  ];
  const breakdown = buildEmergencyBreakdown(emergencies);
  const areas = buildAffectedAreas(emergencies);
  return {
    metrics,
    incidentTrend: buildIncidentTrend(emergencies, anchor),
    responsePerformance: performance,
    emergencyBreakdown: breakdown,
    affectedAreas: areas,
    generatedReports: generatedReports(anchor),
    insights: buildInsights(barangayName, emergencies.length, breakdown, areas, currentPerformance.averageResponseMinutes, previousPerformance.averageResponseMinutes),
  };
}
