import { useCallback, useEffect, useMemo, useState } from "react";
import { useLguEmergencies } from "../../emergency/hooks/useLguEmergencies";
import { normalizeEmergencyType } from "../../emergency/constants/emergency.constants";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type {
  DashboardEmergencyItem,
  DashboardOperationalStats,
  DashboardStatCardItem,
  DashboardStatCardKey,
  DashboardStats,
  DashboardTrend,
  DashboardTrendKind,
} from "../models/lguDashboard.types";
import { useHazardZones } from "../../hazardZones/hooks/useHazardZones";
import {
  fetchLguDashboardOperationalStats,
  fetchLguDashboardStatCards,
} from "../services/lguDashboard.service";

const EMPTY_OPERATIONAL_STATS: DashboardOperationalStats = {
  availableVolunteers: 0,
  totalVolunteers: 0,
  tasksInProgress: 0,
  pendingTasks: 0,
  responseRate: 0,
  respondedTasks: 0,
  dispatchOffers: 0,
};

type DashboardTrendMap = Partial<Record<DashboardStatCardKey, DashboardTrend>>;

function fullName(first?: string, last?: string) {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name.length > 0 ? name : undefined;
}

function toStatus(raw?: string) {
  return String(raw ?? "").trim().toUpperCase();
}

function toProgressLabel(raw?: string): DashboardEmergencyItem["progressLabel"] {
  const label = String(raw ?? "").trim().toUpperCase();
  if (label === "ASSIGNED") return "Assigned";
  if (label === "EN ROUTE") return "En Route";
  if (label === "ARRIVED") return "Arrived";
  if (label === "RESOLVED") return "Resolved";
  if (label === "CANCELLED") return "Cancelled";
  return "Submitted";
}

function toProgressPercent(raw: unknown) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function isActiveEmergencyStatus(raw?: string) {
  const status = toStatus(raw);
  return status !== "RESOLVED" && status !== "CANCELLED";
}

function isRejectedEmergencyReport(report: EmergencyReport) {
  const reportWithVerification = report as EmergencyReport & {
    verification?: {
      status?: string;
    };
  };
  const verificationStatus = String(reportWithVerification.verification?.status ?? "")
    .trim()
    .toLowerCase();
  return verificationStatus === "rejected";
}

function toErrorMessage(error: unknown) {
  const parsed = error as { response?: { data?: { message?: string } }; message?: string };
  return parsed.response?.data?.message || parsed.message || "Failed to sync dashboard stats";
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString();
}

function formatRate(value: number) {
  return `${Math.round(value)}%`;
}

function neutralTrend(kind: DashboardTrendKind, comparisonLabel = "vs 24h ago"): DashboardTrend {
  return {
    value: 0,
    display: kind === "percentagePoints" ? "0 pts" : "0",
    direction: "neutral",
    tone: "neutral",
    kind,
    comparisonLabel,
  };
}

function buildStatCards(
  stats: DashboardStats,
  trendByKey: DashboardTrendMap
): DashboardStatCardItem[] {
  return [
    {
      key: "activeEmergencies",
      label: "Active Emergencies",
      value: stats.active,
      valueDisplay: formatCount(stats.active),
      trend: trendByKey.activeEmergencies ?? neutralTrend("count"),
    },
    {
      key: "availableVolunteers",
      label: "Available Volunteers",
      value: stats.availableVolunteers,
      valueDisplay: formatCount(stats.availableVolunteers),
      trend: trendByKey.availableVolunteers ?? neutralTrend("count"),
    },
    {
      key: "tasksInProgress",
      label: "Tasks In Progress",
      value: stats.tasksInProgress,
      valueDisplay: formatCount(stats.tasksInProgress),
      trend: trendByKey.tasksInProgress ?? neutralTrend("count"),
    },
    {
      key: "responseRate",
      label: "Response Rate",
      value: stats.responseRate,
      valueDisplay: formatRate(stats.responseRate),
      trend: trendByKey.responseRate ?? neutralTrend("percentagePoints"),
    },
  ];
}

export function useLguDashboard() {
  const { reports, loading: emergenciesLoading, error, refetch } = useLguEmergencies();
  const {
    hazardZones,
    loading: hazardsLoading,
    error: hazardsError,
    refetch: refetchHazards,
  } = useHazardZones();

  const [operationalStats, setOperationalStats] =
    useState<DashboardOperationalStats>(EMPTY_OPERATIONAL_STATS);
  const [statsSyncing, setStatsSyncing] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [trendByKey, setTrendByKey] = useState<DashboardTrendMap>({});

  const refetchOperationalStats = useCallback(async () => {
    setStatsSyncing(true);
    setStatsError(null);

    const [liveStatsResult, trendResult] = await Promise.allSettled([
      fetchLguDashboardOperationalStats(),
      fetchLguDashboardStatCards(),
    ]);

    if (liveStatsResult.status === "fulfilled") {
      setOperationalStats(liveStatsResult.value);
    } else {
      setStatsError(toErrorMessage(liveStatsResult.reason));
    }

    if (trendResult.status === "fulfilled") {
      const nextTrends: DashboardTrendMap = {};
      for (const card of trendResult.value.statCards ?? []) {
        nextTrends[card.key] = card.trend;
      }
      setTrendByKey(nextTrends);
    } else {
      // Keep primary card values live even if trend analytics is unavailable.
      setTrendByKey({});
    }

    setStatsSyncing(false);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refetchOperationalStats();
    }, 0);

    return () => window.clearTimeout(id);
  }, [refetchOperationalStats]);

  const refetchAll = useCallback(async () => {
    await Promise.all([refetch(), refetchHazards(), refetchOperationalStats()]);
  }, [refetch, refetchHazards, refetchOperationalStats]);

  const items: DashboardEmergencyItem[] = useMemo(() => {
    return (reports ?? [])
      .filter((report) => !isRejectedEmergencyReport(report))
      .map((r) => {
        const coords = r.location?.coordinates;
        const lng = Array.isArray(coords) ? coords[0] : NaN;
        const lat = Array.isArray(coords) ? coords[1] : NaN;

        const reporterObj = typeof r.reportedBy === "object" ? r.reportedBy : undefined;
        const reporterName = reporterObj ? fullName(reporterObj.firstName, reporterObj.lastName) : undefined;

        return {
          id: r._id,
          type: normalizeEmergencyType(r.emergencyType),
          status: toStatus(r.status),
          progressLabel: toProgressLabel(r.progressLabel),
          progressPercent: toProgressPercent(r.progressPercent),
          lng,
          lat,
          notes: r.notes,
          reportedAt: r.reportedAt || r.createdAt,
          reporterName,
          barangayName: r.barangayName ?? null,
          barangayCity: r.barangayCity ?? null,
        };
      })
      .filter((x) => Number.isFinite(x.lng) && Number.isFinite(x.lat));
  }, [reports]);

  const activeItems = useMemo(
    () => items.filter((item) => isActiveEmergencyStatus(item.status)),
    [items]
  );

  const stats: DashboardStats = useMemo(() => {
    const total = items.length;
    const open = items.filter((i) => toStatus(i.status) === "OPEN").length;
    const acknowledged = items.filter((i) => toStatus(i.status) === "ACKNOWLEDGED").length;
    const resolved = items.filter((i) => toStatus(i.status) === "RESOLVED").length;
    const active = items.filter((i) => {
      const status = toStatus(i.status);
      return status === "OPEN" || status === "ACKNOWLEDGED";
    }).length;

    return {
      total,
      active,
      open,
      acknowledged,
      resolved,
      availableVolunteers: operationalStats.availableVolunteers,
      totalVolunteers: operationalStats.totalVolunteers,
      tasksInProgress: operationalStats.tasksInProgress,
      pendingTasks: operationalStats.pendingTasks,
      responseRate: operationalStats.responseRate,
      respondedTasks: operationalStats.respondedTasks,
      dispatchOffers: operationalStats.dispatchOffers,
    };
  }, [items, operationalStats]);

  const statCards = useMemo(() => buildStatCards(stats, trendByKey), [stats, trendByKey]);

  const recent = useMemo(() => {
    return [...activeItems]
      .sort((a, b) => {
        const at = a.reportedAt ? new Date(a.reportedAt).getTime() : 0;
        const bt = b.reportedAt ? new Date(b.reportedAt).getTime() : 0;
        return bt - at;
      })
      .slice(0, 7);
  }, [activeItems]);

  return {
    loading: emergenciesLoading || hazardsLoading,
    error,
    refetch: refetchAll,
    stats,
    statCards,
    statsSyncing,
    statsError,
    pins: activeItems,
    recent,
    hazardZones,
    hazardsLoading,
    hazardsError,
    refetchHazards,
  };
}
