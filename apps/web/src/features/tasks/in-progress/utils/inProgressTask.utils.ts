import type { DispatchTask } from "../../models/tasks.types";
import { AWAITING_UPDATE_AFTER_MS } from "../constants/inProgressTasks.constants";
import type {
  InProgressFilterOptions,
  InProgressPriority,
  InProgressSort,
  InProgressTaskFilters,
  InProgressTaskGroup,
  InProgressTaskStatistics,
} from "../types/inProgressTask.types";

const PRIORITY_ORDER: Record<InProgressPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  UNSPECIFIED: 3,
};

function dateMs(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizePriority(value?: string | null): InProgressPriority {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "HIGH" || normalized === "MEDIUM" || normalized === "LOW") return normalized;
  return "UNSPECIFIED";
}

export function parsePriorityFilter(value: string): InProgressTaskFilters["priority"] {
  switch (value) {
    case "HIGH":
    case "MEDIUM":
    case "LOW":
    case "UNSPECIFIED":
      return value;
    default:
      return "ALL";
  }
}

export function parseInProgressSort(value: string): InProgressSort {
  switch (value) {
    case "REPORTED_NEWEST":
    case "REPORTED_OLDEST":
    case "PRIORITY":
    case "EMERGENCY_TYPE":
    case "RESPONDER_COUNT":
      return value;
    default:
      return "LAST_UPDATED";
  }
}

export function getEmergencyAppearance(type: string) {
  const value = type.toLocaleLowerCase();
  if (value.includes("fire")) return { accent: "border-l-red-500", surface: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300" };
  if (value.includes("medical")) return { accent: "border-l-emerald-500", surface: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" };
  if (value.includes("flood")) return { accent: "border-l-sky-500", surface: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" };
  if (value.includes("typhoon") || value.includes("storm")) return { accent: "border-l-violet-500", surface: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" };
  if (value.includes("earthquake")) return { accent: "border-l-amber-500", surface: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" };
  return { accent: "border-l-red-500", surface: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300" };
}

export function buildInProgressGroups(tasks: DispatchTask[], referenceTime: number): InProgressTaskGroup[] {
  const byEmergency = new Map<string, InProgressTaskGroup>();

  for (const task of tasks) {
    const emergency = task.emergency;
    if (!emergency?.id) continue;
    const taskUpdatedAt = task.updatedAt ?? task.respondedAt ?? emergency.reportedAt ?? task.createdAt ?? null;
    const existing = byEmergency.get(emergency.id);

    if (existing) {
      existing.offers.push(task);
      if (dateMs(taskUpdatedAt) > existing.updatedAtMs) {
        existing.updatedAt = taskUpdatedAt;
        existing.updatedAtMs = dateMs(taskUpdatedAt);
      }
      continue;
    }

    const updatedAtMs = dateMs(taskUpdatedAt);
    byEmergency.set(emergency.id, {
      id: emergency.id,
      emergency,
      offers: [task],
      priority: normalizePriority(emergency.priority),
      reportedAt: emergency.reportedAt ?? task.createdAt ?? null,
      updatedAt: taskUpdatedAt,
      updatedAtMs,
      awaitingUpdate: updatedAtMs > 0 && referenceTime - updatedAtMs >= AWAITING_UPDATE_AFTER_MS,
    });
  }

  return Array.from(byEmergency.values()).map((group) => ({
    ...group,
    awaitingUpdate: group.updatedAtMs > 0 && referenceTime - group.updatedAtMs >= AWAITING_UPDATE_AFTER_MS,
  }));
}

export function getInProgressFilterOptions(groups: InProgressTaskGroup[]): InProgressFilterOptions {
  const emergencyTypes = new Set<string>();
  const barangays = new Set<string>();
  for (const group of groups) {
    if (group.emergency.emergencyType) emergencyTypes.add(group.emergency.emergencyType);
    if (group.emergency.barangayName) barangays.add(group.emergency.barangayName);
  }
  return {
    emergencyTypes: Array.from(emergencyTypes).sort((a, b) => a.localeCompare(b)),
    barangays: Array.from(barangays).sort((a, b) => a.localeCompare(b)),
  };
}

export function filterInProgressGroups(groups: InProgressTaskGroup[], filters: InProgressTaskFilters) {
  const responderQuery = filters.responder.trim().toLocaleLowerCase();
  return groups.filter((group) => {
    if (filters.emergencyType !== "ALL" && group.emergency.emergencyType !== filters.emergencyType) return false;
    if (filters.barangay !== "ALL" && group.emergency.barangayName !== filters.barangay) return false;
    if (filters.priority !== "ALL" && group.priority !== filters.priority) return false;
    if (responderQuery && !group.offers.some((offer) => offer.volunteer?.name.toLocaleLowerCase().includes(responderQuery))) return false;
    return true;
  });
}

export function sortInProgressGroups(groups: InProgressTaskGroup[], sort: InProgressSort) {
  return [...groups].sort((a, b) => {
    switch (sort) {
      case "REPORTED_NEWEST":
        return dateMs(b.reportedAt) - dateMs(a.reportedAt);
      case "REPORTED_OLDEST":
        return dateMs(a.reportedAt) - dateMs(b.reportedAt);
      case "PRIORITY":
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case "EMERGENCY_TYPE":
        return a.emergency.emergencyType.localeCompare(b.emergency.emergencyType);
      case "RESPONDER_COUNT":
        return b.offers.length - a.offers.length;
      default:
        return b.updatedAtMs - a.updatedAtMs;
    }
  });
}

export function calculateInProgressStats(groups: InProgressTaskGroup[]): InProgressTaskStatistics {
  return {
    activeEmergencies: groups.length,
    respondersEnRoute: groups.reduce((total, group) => total + group.offers.length, 0),
    awaitingUpdate: groups.filter((group) => group.awaitingUpdate).length,
    averageArrivalTimeMs: null,
  };
}

export function hasActiveInProgressFilters(filters: InProgressTaskFilters) {
  return filters.emergencyType !== "ALL" || filters.barangay !== "ALL" || filters.priority !== "ALL" || filters.responder.trim().length > 0;
}

export function formatTaskDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatRelativeUpdate(value: string | null, referenceTime: number) {
  const valueMs = dateMs(value);
  if (!valueMs) return "Update unavailable";
  const minutes = Math.max(0, Math.floor((referenceTime - valueMs) / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatCoordinates(lat?: number | null, lng?: number | null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${lat?.toFixed(5)}, ${lng?.toFixed(5)}`;
}

export function getInitials(name?: string | null) {
  if (!name?.trim()) return "V";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
