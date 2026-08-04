import { api } from "../../../../lib/api";
import type { DispatchTask } from "../../models/tasks.types";
import type {
  CompletedTaskSort,
  CompletedTaskStatistics,
  PaginationMetadata,
  TaskStatusCounts,
} from "../types/completedTask.types";

function toEpoch(value?: string | null) {
  if (!value) return 0;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
}

export function shortenTaskId(id: string) {
  const value = String(id ?? "").trim();
  if (value.length <= 14) return value || "—";
  return `${value.slice(0, 7)}…${value.slice(-5)}`;
}

export function getInitials(name?: string | null) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "V";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`.toUpperCase();
}

export function formatVolunteerRole(role?: string | null) {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (!normalized || normalized === "VOLUNTEER") return "General Volunteer";
  return normalized
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function resolveTaskAvatarUrl(value?: string | null) {
  const avatar = String(value ?? "").trim();
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;

  const base = String(api.defaults.baseURL ?? "").trim();
  if (!base) return avatar;

  try {
    const baseUrl = new URL(base);
    return new URL(avatar, `${baseUrl.protocol}//${baseUrl.host}`).toString();
  } catch {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${normalizedBase}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  }
}

export function formatTaskDateTime(value?: string | null) {
  const epoch = toEpoch(value);
  if (!epoch) return { date: "—", time: "Not available", dateTime: undefined };
  const date = new Date(epoch);
  return {
    date: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date),
    dateTime: date.toISOString(),
  };
}

export function formatCoordinates(lat?: number | null, lng?: number | null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

export function formatDuration(durationMs: number | null) {
  if (durationMs === null || !Number.isFinite(durationMs) || durationMs < 0) return "—";
  const totalSeconds = Math.round(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function sortCompletedTasks(tasks: DispatchTask[], sort: CompletedTaskSort) {
  return [...tasks].sort((a, b) => {
    if (sort === "COMPLETED_OLDEST") return toEpoch(a.completedAt) - toEpoch(b.completedAt);
    if (sort === "VERIFIED_NEWEST") return toEpoch(b.verifiedAt) - toEpoch(a.verifiedAt);
    if (sort === "VOLUNTEER_NAME") {
      return String(a.volunteer?.name ?? "").localeCompare(String(b.volunteer?.name ?? ""), undefined, {
        sensitivity: "base",
      });
    }
    if (sort === "EMERGENCY_TYPE") {
      return String(a.emergency?.emergencyType ?? "").localeCompare(
        String(b.emergency?.emergencyType ?? ""),
        undefined,
        { sensitivity: "base" },
      );
    }
    return toEpoch(b.completedAt) - toEpoch(a.completedAt);
  });
}

export function paginateCompletedTasks(tasks: DispatchTask[], page: number, pageSize: number) {
  const totalItems = tasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = tasks.slice(start, start + pageSize);
  const pagination: PaginationMetadata = {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    firstItem: totalItems === 0 ? 0 : start + 1,
    lastItem: Math.min(start + items.length, totalItems),
  };
  return { items, pagination };
}

function isToday(value?: string | null) {
  const epoch = toEpoch(value);
  if (!epoch) return false;
  const date = new Date(epoch);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function calculateCompletedTaskStatistics(
  completedTasks: DispatchTask[],
  overviewTasks: DispatchTask[] | null,
): CompletedTaskStatistics {
  const responseDurations = completedTasks
    .map((task) => {
      const assignedAt = toEpoch(task.createdAt);
      const respondedAt = toEpoch(task.respondedAt);
      return assignedAt > 0 && respondedAt >= assignedAt ? respondedAt - assignedAt : null;
    })
    .filter((value): value is number => value !== null);

  const relevantTasks = overviewTasks?.filter((task) =>
    ["ACCEPTED", "DONE", "VERIFIED", "CANCELLED"].includes(String(task.status ?? "").toUpperCase()),
  );
  const verifiedCount = relevantTasks?.filter(
    (task) => String(task.status ?? "").toUpperCase() === "VERIFIED",
  ).length;

  return {
    totalCompleted: completedTasks.length,
    verifiedToday: completedTasks.filter((task) => isToday(task.verifiedAt)).length,
    averageResponseTimeMs:
      responseDurations.length > 0
        ? responseDurations.reduce((total, duration) => total + duration, 0) / responseDurations.length
        : null,
    completionRate:
      relevantTasks && relevantTasks.length > 0 && verifiedCount !== undefined
        ? (verifiedCount / relevantTasks.length) * 100
        : null,
  };
}

export function calculateTaskStatusCounts(
  completedCount: number,
  overviewTasks: DispatchTask[] | null,
): TaskStatusCounts {
  if (!overviewTasks) {
    return { all: null, inProgress: null, forReview: null, completed: completedCount, canceled: null };
  }

  const count = (status: string) =>
    overviewTasks.filter((task) => String(task.status ?? "").toUpperCase() === status).length;

  return {
    all: overviewTasks.length,
    inProgress: count("ACCEPTED"),
    forReview: count("DONE"),
    completed: completedCount,
    canceled: count("CANCELLED"),
  };
}
