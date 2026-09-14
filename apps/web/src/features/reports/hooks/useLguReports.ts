import { useCallback, useEffect, useMemo, useState } from "react";
import { useLguSession } from "../../auth/hooks/useLguSession";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import { DEFAULT_REPORTS_FILTERS } from "../constants/reports.constants";
import type { ReportsFilters } from "../models/reports.types";
import { fetchReportsData } from "../services/reports.service";
import { buildReportsDashboard, filterEmergencies, filterTasks } from "../utils/reports.utils";

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate.response?.data?.message || candidate.message || "Failed to load reports";
}

export function useLguReports() {
  const { user } = useLguSession();
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [tasks, setTasks] = useState<DispatchTask[]>([]);
  const [filters, setFilters] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barangayName = String(user?.barangay || "Barangay").trim() || "Barangay";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportsData();
      setEmergencies(data.emergencies ?? []);
      setTasks(data.tasks ?? []);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const emergencyTypeOptions = useMemo(
    () => ["ALL", ...Array.from(new Set(emergencies.map((item) => item.emergencyType).filter(Boolean))).sort()],
    [emergencies],
  );

  const statusOptions = useMemo(
    () => ["ALL", ...Array.from(new Set(emergencies.map((item) => item.status).filter(Boolean))).sort()],
    [emergencies],
  );

  const filteredEmergencies = useMemo(() => filterEmergencies(emergencies, filters), [emergencies, filters]);
  const filteredTasks = useMemo(
    () => filterTasks(tasks, emergencies, filteredEmergencies, filters),
    [tasks, emergencies, filteredEmergencies, filters],
  );

  const dashboard = useMemo(
    () =>
      buildReportsDashboard({
        allEmergencies: emergencies,
        allTasks: tasks,
        emergencies: filteredEmergencies,
        tasks: filteredTasks,
        filters,
        barangayName,
      }),
    [emergencies, tasks, filteredEmergencies, filteredTasks, filters, barangayName],
  );

  const clearFilters = useCallback(() => setFilters(DEFAULT_REPORTS_FILTERS), []);

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
    const rows = filteredTasks.map((task) => [
      task.id,
      task.status,
      task.emergency?.id,
      task.emergency?.emergencyType,
      task.emergency?.barangayName || "",
      task.emergency?.reportedAt || "",
      task.respondedAt || "",
      task.completedAt || "",
      task.verifiedAt || "",
      task.volunteer?.name || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`lgu-report-tasks-${stamp}.csv`, csv, "text/csv");
  }, [filteredTasks]);

  return {
    loading,
    error,
    barangayName,
    filters,
    setFilters,
    clearFilters,
    emergencyTypeOptions,
    statusOptions,
    ...dashboard,
    exportTasksCsv,
    refresh,
  };
}
