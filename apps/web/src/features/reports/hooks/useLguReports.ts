import { useCallback, useEffect, useMemo, useState } from "react";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import type { ReportsFilters, ReportsSummary } from "../models/reports.types";
import { fetchReportsData } from "../services/reports.service";

const defaultFilters: ReportsFilters = { dateFrom: "", dateTo: "", emergencyType: "ALL" };

function toStartOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T00:00:00.000`);
  return d.toISOString();
}

function toEndOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T23:59:59.999`);
  return d.toISOString();
}

function safeIso(v?: string | null) {
  const s = String(v || "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function emergencyDate(e: EmergencyReport) {
  return safeIso(e.reportedAt) || safeIso(e.createdAt) || safeIso(e.updatedAt) || "";
}

function taskEmergencyReportedAt(t: DispatchTask) {
  return safeIso(t.emergency?.reportedAt) || "";
}

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function useLguReports() {
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [tasks, setTasks] = useState<DispatchTask[]>([]);
  const [filters, setFilters] = useState<ReportsFilters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportsData();
      setEmergencies(data.emergencies ?? []);
      setTasks(data.tasks ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const emergencyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of emergencies) {
      const v = String(e.emergencyType || "").trim();
      if (v) set.add(v);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [emergencies]);

  const filteredEmergencies = useMemo(() => {
    const fromIso = filters.dateFrom ? toStartOfDayIso(filters.dateFrom) : "";
    const toIso = filters.dateTo ? toEndOfDayIso(filters.dateTo) : "";
    const type = String(filters.emergencyType || "ALL");

    return emergencies.filter((e) => {
      const dt = emergencyDate(e);
      if (fromIso && dt && dt < fromIso) return false;
      if (toIso && dt && dt > toIso) return false;
      if (type !== "ALL" && String(e.emergencyType || "") !== type) return false;
      return true;
    });
  }, [emergencies, filters]);

  const filteredTasks = useMemo(() => {
    const fromIso = filters.dateFrom ? toStartOfDayIso(filters.dateFrom) : "";
    const toIso = filters.dateTo ? toEndOfDayIso(filters.dateTo) : "";
    const type = String(filters.emergencyType || "ALL");

    return tasks.filter((t) => {
      const dt = taskEmergencyReportedAt(t) || safeIso(t.createdAt) || safeIso(t.updatedAt) || "";
      if (fromIso && dt && dt < fromIso) return false;
      if (toIso && dt && dt > toIso) return false;
      if (type !== "ALL" && String(t.emergency?.emergencyType || "") !== type) return false;
      return true;
    });
  }, [tasks, filters]);

  const summary: ReportsSummary = useMemo(() => {
    const activeTasks = filteredTasks.filter((t) => String(t.status).toUpperCase() === "ACCEPTED").length;
    const completedTasks = filteredTasks.filter((t) => String(t.status).toUpperCase() === "VERIFIED").length;

    const responseMins: number[] = [];
    for (const t of filteredTasks) {
      const r = safeIso(t.respondedAt);
      const rep = safeIso(t.emergency?.reportedAt);
      if (!r || !rep) continue;
      const ms = new Date(r).getTime() - new Date(rep).getTime();
      if (Number.isFinite(ms) && ms >= 0) responseMins.push(ms / 60000);
    }

    const avg =
      responseMins.length > 0 ? responseMins.reduce((a, b) => a + b, 0) / responseMins.length : null;

    return {
      totalEmergencies: filteredEmergencies.length,
      activeTasks,
      completedTasks,
      avgResponseMinutes: avg ? Math.round(avg * 10) / 10 : null,
    };
  }, [filteredEmergencies.length, filteredTasks]);

  const exportTasksCsv = useCallback(() => {
    const header = [
      "dispatchId",
      "status",
      "emergencyId",
      "emergencyType",
      "barangay",
      "reportedAt",
      "respondedAt",
      "completedAt",
      "verifiedAt",
      "volunteer",
    ];

    const rows = filteredTasks.map((t) => [
      t.id,
      t.status,
      t.emergency?.id,
      t.emergency?.emergencyType,
      t.emergency?.barangayName || "",
      t.emergency?.reportedAt || "",
      t.respondedAt || "",
      t.completedAt || "",
      t.verifiedAt || "",
      t.volunteer?.name || "",
    ]);

    const csv =
      header.join(",") +
      "\n" +
      rows.map((r) => r.map(csvEscape).join(",")).join("\n");

    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`lgu-report-tasks-${stamp}.csv`, csv, "text/csv");
  }, [filteredTasks]);

  return {
    loading,
    error,
    filters,
    setFilters,
    clearFilters: () => setFilters(defaultFilters),
    refresh,
    emergencyTypeOptions,
    emergencies: filteredEmergencies,
    tasks: filteredTasks,
    summary,
    exportTasksCsv,
  };
}

