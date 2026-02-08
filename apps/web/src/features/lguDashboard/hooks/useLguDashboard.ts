import { useMemo } from "react";
import { useLguEmergencies } from "../../emergency/hooks/useLguEmergencies";
import { normalizeEmergencyType } from "../../emergency/constants/emergency.constants";
import type { DashboardEmergencyItem, DashboardStats } from "../models/lguDashboard.types";

function fullName(first?: string, last?: string) {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name.length > 0 ? name : undefined;
}

export function useLguDashboard() {
  const { reports, loading, error, refetch } = useLguEmergencies();

  const items: DashboardEmergencyItem[] = useMemo(() => {
    return (reports ?? [])
      .map((r) => {
        const coords = r.location?.coordinates;
        const lng = Array.isArray(coords) ? coords[0] : NaN;
        const lat = Array.isArray(coords) ? coords[1] : NaN;

        const reporterObj = typeof r.reportedBy === "object" ? r.reportedBy : undefined;
        const reporterName = reporterObj ? fullName(reporterObj.firstName, reporterObj.lastName) : undefined;

        return {
          id: r._id,
          type: normalizeEmergencyType(r.emergencyType),
          status: r.status,
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

  const stats: DashboardStats = useMemo(() => {
    const total = items.length;
    const open = items.filter((i) => i.status === "OPEN").length;
    const acknowledged = items.filter((i) => i.status === "ACKNOWLEDGED").length;
    const resolved = items.filter((i) => i.status === "RESOLVED").length;
    const active = items.filter((i) => i.status === "OPEN" || i.status === "ACKNOWLEDGED").length;
    return { total, active, open, acknowledged, resolved };
  }, [items]);

  const recent = useMemo(() => {
    // newest first (reportedAt or createdAt)
    return [...items]
      .sort((a, b) => {
        const at = a.reportedAt ? new Date(a.reportedAt).getTime() : 0;
        const bt = b.reportedAt ? new Date(b.reportedAt).getTime() : 0;
        return bt - at;
      })
      .slice(0, 7);
  }, [items]);

  return {
    loading,
    error,
    refetch,
    stats,
    pins: items,
    recent,
  };
}
