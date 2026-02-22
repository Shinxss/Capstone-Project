import { useCallback, useEffect, useMemo, useState } from "react";
import type { EmergencyReport } from "../models/emergency.types";
import { fetchEmergencyReports } from "../services/emergency.service";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";

export type EmergencyType = "SOS" | "Flood" | "Fire" | "Typhoon" | "Earthquake" | "Collapse";
type Priority = "critical" | "high" | "medium";
type Status = "active" | "in_progress" | "resolved" | "pending";

export type LguEmergencyItem = {
  id: string;
  type: EmergencyType;
  title: string;
  location: string;
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

function normalizeType(raw?: string): EmergencyType {
  const up = String(raw || "").toUpperCase();
  if (up === "SOS") return "SOS";
  if (up === "FIRE") return "Fire";
  if (up === "FLOOD") return "Flood";
  if (up === "EARTHQUAKE") return "Earthquake";
  if (up === "TYPHOON") return "Typhoon";
  if (up === "COLLAPSE") return "Collapse";
  return "SOS";
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
  const then = new Date(iso).getTime();
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
  const reportedBy: any = report.reportedBy;
  if (!reportedBy || typeof reportedBy === "string") return "Unknown Reporter";

  const fullName = `${reportedBy.firstName || ""} ${reportedBy.lastName || ""}`.trim();
  return fullName || reportedBy.username || reportedBy.email || "Unknown Reporter";
}

function locationLabelFrom(report: EmergencyReport) {
  const coords = report.location?.coordinates;
  if (!coords || coords.length !== 2) return "Unknown location";
  const [lng, lat] = coords;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
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

function toEmergencyItem(report: EmergencyReport, volunteerCounts?: DispatchVolunteerCounts): LguEmergencyItem {
  const isSOS = String(report.emergencyType).toUpperCase() === "SOS" || String(report.source).toUpperCase() === "SOS_BUTTON";
  const created = report.reportedAt || report.createdAt || report.updatedAt;
  const volunteersAssigned = Number(volunteerCounts?.assigned ?? 0);
  const volunteersNeeded = Number(volunteerCounts?.needed ?? 0);
  const progressPercent = volunteersNeeded > 0 ? Math.round((volunteersAssigned / volunteersNeeded) * 100) : 0;

  return {
    id: report._id,
    type: normalizeType(report.emergencyType),
    title: isSOS ? "SOS Emergency" : `${normalizeType(report.emergencyType)} Emergency`,
    location: locationLabelFrom(report),
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

export function useLguEmergencies() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [dispatchCountsByEmergency, setDispatchCountsByEmergency] = useState<DispatchCountsByEmergency>({});
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
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load emergencies");
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
        .filter((item) => item.status !== "resolved"),
    [reports, dispatchCountsByEmergency]
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
  };
}
