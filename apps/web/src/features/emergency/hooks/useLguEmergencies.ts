import { useCallback, useEffect, useMemo, useState } from "react";
import type { EmergencyReport, Reporter } from "../models/emergency.types";
import { fetchEmergencyReports } from "../services/emergency.service";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";

export type EmergencyType =
  | "SOS"
  | "Flood"
  | "Fire"
  | "Typhoon"
  | "Earthquake"
  | "Collapse"
  | "Medical"
  | "Other";
type Priority = "critical" | "high" | "medium";
type Status = "active" | "in_progress" | "resolved" | "pending";

export type LguEmergencyItem = {
  id: string;
  type: EmergencyType;
  title: string;
  location: string;
  reportedAt?: string;
  reportedAtTimestamp: number;
  timeAgo: string;
  priority: Priority;
  status: Status;
  isSOS?: boolean;
  reporterLabel: string;
  reporterName: string;
  reporterVerified?: boolean;
  phone?: string;
  description: string;
  needs: string[];
  volunteersAssigned: number;
  volunteersNeeded: number;
  progressPercent: number;
};

export type LguEmergencyTypeFilter = "ALL" | "SOS" | EmergencyType;

type DispatchVolunteerCounts = {
  assigned: number;
  needed: number;
};

type DispatchCountsByEmergency = Record<string, DispatchVolunteerCounts>;

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function normalizeType(raw?: string): EmergencyType {
  const up = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  if (up === "SOS") return "SOS";
  if (up === "FIRE") return "Fire";
  if (up === "FLOOD") return "Flood";
  if (up === "EARTHQUAKE") return "Earthquake";
  if (up === "TYPHOON") return "Typhoon";
  if (up === "COLLAPSE") return "Collapse";
  if (up === "MEDICAL") return "Medical";
  if (up === "OTHER" || up === "OTHERS") return "Other";
  return "Other";
}

function normalizeStatus(raw?: string): Status {
  const up = String(raw || "").toUpperCase();
  if (up === "OPEN") return "active";
  if (up === "ACKNOWLEDGED") return "in_progress";
  if (up === "RESOLVED" || up === "CANCELLED") return "resolved";
  return "active";
}

function formatTimeAgo(iso?: string) {
  if (!iso) return "Just now";
  const then = toTimestamp(iso);
  if (then <= 0) return "Just now";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;

  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function reporterNameFrom(report: EmergencyReport) {
  const reportedBy = report.reportedBy;
  if (!reportedBy || typeof reportedBy === "string") return "Unknown Reporter";

  const reporter = reportedBy as Reporter;
  const fullName = `${reporter.firstName || ""} ${reporter.lastName || ""}`.trim();
  return fullName || reporter.username || reporter.email || "Unknown Reporter";
}

function toErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const withResponse = error as { response?: { data?: { message?: unknown } } };
    const serverMessage = withResponse.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;

    const withMessage = error as { message?: unknown };
    if (typeof withMessage.message === "string" && withMessage.message.trim()) {
      return withMessage.message;
    }
  }
  return "Failed to load emergencies";
}

function locationLabelFrom(report: EmergencyReport) {
  const exactLabel = String(report.locationLabel || "").trim();
  if (exactLabel) return exactLabel;

  const barangay = String(report.barangayName || "").trim();
  const city = String(report.barangayCity || "").trim();
  const province = String(report.barangayProvince || "").trim();

  if (barangay) {
    return [
      `Barangay ${barangay}`,
      city || null,
      province || null,
    ]
      .filter(Boolean)
      .join(", ");
  }

  const coordinates = report.location?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  return "Unknown location";
}

function buildDispatchCountsByEmergency(tasks: DispatchTask[]): DispatchCountsByEmergency {
  const counts: DispatchCountsByEmergency = {};

  for (const task of tasks ?? []) {
    const emergencyId = String(task?.emergency?.id || "").trim();
    if (!emergencyId) continue;

    const status = String(task?.status || "").toUpperCase();
    if (status === "CANCELLED" || status === "DECLINED") continue;

    const existing = counts[emergencyId] ?? { assigned: 0, needed: 0 };
    existing.needed += 1;

    if (status === "ACCEPTED" || status === "DONE" || status === "VERIFIED") {
      existing.assigned += 1;
    }

    counts[emergencyId] = existing;
  }

  return counts;
}

function buildCompletedEmergencyIds(tasks: DispatchTask[]): Set<string> {
  const statusByEmergency = new Map<
    string,
    {
      hasPendingOrAccepted: boolean;
      hasDoneOrVerified: boolean;
    }
  >();

  for (const task of tasks ?? []) {
    const emergencyId = String(task?.emergency?.id || "").trim();
    if (!emergencyId) continue;

    const status = String(task?.status || "").toUpperCase();
    if (status === "CANCELLED" || status === "DECLINED") continue;

    const current = statusByEmergency.get(emergencyId) ?? {
      hasPendingOrAccepted: false,
      hasDoneOrVerified: false,
    };

    if (status === "PENDING" || status === "ACCEPTED") {
      current.hasPendingOrAccepted = true;
    }
    if (status === "DONE" || status === "VERIFIED") {
      current.hasDoneOrVerified = true;
    }

    statusByEmergency.set(emergencyId, current);
  }

  const completedIds = new Set<string>();
  for (const [emergencyId, progress] of statusByEmergency.entries()) {
    if (progress.hasDoneOrVerified && !progress.hasPendingOrAccepted) {
      completedIds.add(emergencyId);
    }
  }

  return completedIds;
}

function toEmergencyItem(report: EmergencyReport, volunteerCounts?: DispatchVolunteerCounts): LguEmergencyItem {
  const type = normalizeType(report.emergencyType);
  const isSOS = type === "SOS";
  const created = report.reportedAt || report.createdAt || report.updatedAt;
  const volunteersAssigned = Number(volunteerCounts?.assigned ?? 0);
  const volunteersNeeded = Number(volunteerCounts?.needed ?? 0);
  const progressPercent = volunteersNeeded > 0 ? Math.round((volunteersAssigned / volunteersNeeded) * 100) : 0;
  const reportedAtTimestamp = toTimestamp(created);

  return {
    id: report._id,
    type,
    title: isSOS ? "SOS Emergency" : `${type} Emergency`,
    location: locationLabelFrom(report),
    reportedAt: created,
    reportedAtTimestamp,
    timeAgo: formatTimeAgo(created),
    priority: isSOS ? "critical" : "high",
    status: normalizeStatus(report.status),
    isSOS,
    reporterLabel: isSOS ? "SOS Reported by" : "Reported by",
    reporterName: reporterNameFrom(report),
    reporterVerified: false,
    phone: undefined,
    description: report.notes || `Reported via ${report.source}`,
    needs: [],
    volunteersAssigned,
    volunteersNeeded,
    progressPercent,
  };
}

function isOperationalStatus(status: Status) {
  return status === "active" || status === "in_progress" || status === "pending";
}

function priorityRank(priority: Priority) {
  if (priority === "critical") return 0;
  if (priority === "high") return 1;
  if (priority === "medium") return 2;
  return 3;
}

function emergencyGroupRank(item: LguEmergencyItem) {
  const operational = isOperationalStatus(item.status);
  if (item.isSOS && operational) return 0;
  if (operational) return 1;
  return 2;
}

function compareEmergencyItems(a: LguEmergencyItem, b: LguEmergencyItem) {
  const groupDiff = emergencyGroupRank(a) - emergencyGroupRank(b);
  if (groupDiff !== 0) return groupDiff;

  const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
  if (priorityDiff !== 0) return priorityDiff;

  const aTimestamp = a.reportedAtTimestamp;
  const bTimestamp = b.reportedAtTimestamp;
  if (aTimestamp !== bTimestamp) return bTimestamp - aTimestamp;

  return a.id.localeCompare(b.id);
}

export function useLguEmergencies() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [dispatchCountsByEmergency, setDispatchCountsByEmergency] = useState<DispatchCountsByEmergency>({});
  const [completedEmergencyIds, setCompletedEmergencyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LguEmergencyTypeFilter>("ALL");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsData, dispatchTasksData] = await Promise.all([
        fetchEmergencyReports(200),
        fetchLguTasksByStatus("PENDING,ACCEPTED,DONE,VERIFIED").catch(() => [] as DispatchTask[]),
      ]);

      setReports(reportsData);
      setDispatchCountsByEmergency(buildDispatchCountsByEmergency(dispatchTasksData));
      setCompletedEmergencyIds(buildCompletedEmergencyIds(dispatchTasksData));
    } catch (error: unknown) {
      setError(toErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const items = useMemo(
    () =>
      reports
        .map((report) => toEmergencyItem(report, dispatchCountsByEmergency[String(report._id)]))
        .filter((item) => item.status !== "resolved")
        .filter((item) => !completedEmergencyIds.has(String(item.id)))
        .filter((item) => item.volunteersAssigned === 0)
        .sort(compareEmergencyItems),
    [reports, dispatchCountsByEmergency, completedEmergencyIds]
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        query.trim() === "" ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.reporterName.toLowerCase().includes(query.toLowerCase());

      const matchesType = typeFilter === "ALL" ? true : typeFilter === "SOS" ? !!item.isSOS : item.type === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [items, query, typeFilter]);

  const sosCount = useMemo(() => items.filter((item) => item.isSOS).length, [items]);

  const stats = useMemo(
    () => ({
      activeSOS: String(sosCount),
      critical: String(items.filter((item) => item.priority === "critical").length),
      high: String(items.filter((item) => item.priority === "high").length),
      inProgress: String(items.filter((item) => item.status === "in_progress").length),
      deployed: String(items.reduce((sum, item) => sum + item.volunteersAssigned, 0)),
    }),
    [items, sosCount]
  );

  return {
    reports,
    loading,
    error,
    refetch,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    items,
    filtered,
    sosCount,
    stats,
    completedEmergencyIds,
  };
}
