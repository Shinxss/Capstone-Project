import { useCallback, useMemo, useState } from "react";
import type { DispatchTask } from "../models/tasks.types";
import { useLguTasks } from "./useLguTasks";

export type TaskHistoryFilters = {
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
  emergencyType: string; // "ALL" or specific
  volunteer: string;
  barangay: string;
};

const defaultFilters: TaskHistoryFilters = {
  dateFrom: "",
  dateTo: "",
  emergencyType: "ALL",
  volunteer: "",
  barangay: "",
};

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

function dateForStatus(t: DispatchTask, status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "VERIFIED") return safeIso(t.verifiedAt) || safeIso(t.completedAt) || safeIso(t.updatedAt) || "";
  if (s === "CANCELLED") return safeIso(t.respondedAt) || safeIso(t.updatedAt) || "";
  return safeIso(t.updatedAt) || safeIso(t.createdAt) || "";
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

function deriveCancellation(t: DispatchTask) {
  // Backend does not currently store cancellation reason/actor. Provide friendly placeholders.
  const canceledAt = t.respondedAt || t.updatedAt || "";
  let reason = "Cancelled";
  if (t.respondedAt) reason = "Auto-cancelled (volunteer accepted another dispatch)";
  return {
    canceledBy: "System",
    reason,
    canceledAt,
    originalAssignee: t.volunteer?.name || "Volunteer",
  };
}

export function useLguTaskHistory(status: string) {
  const { tasks, loading, error, refetch } = useLguTasks(status);
  const [filters, setFilters] = useState<TaskHistoryFilters>(defaultFilters);

  const emergencyTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      const v = String(t.emergency?.emergencyType || "").trim();
      if (v) set.add(v);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tasks]);

  const filtered = useMemo(() => {
    const fromIso = filters.dateFrom ? toStartOfDayIso(filters.dateFrom) : "";
    const toIso = filters.dateTo ? toEndOfDayIso(filters.dateTo) : "";
    const type = String(filters.emergencyType || "ALL");
    const volQ = filters.volunteer.trim().toLowerCase();
    const brgyQ = filters.barangay.trim().toLowerCase();

    return tasks
      .filter((t) => {
        const dt = dateForStatus(t, status);
        if (fromIso && dt && dt < fromIso) return false;
        if (toIso && dt && dt > toIso) return false;

        const eType = String(t.emergency?.emergencyType || "").trim();
        if (type !== "ALL" && eType !== type) return false;

        const vName = String(t.volunteer?.name || "").toLowerCase();
        if (volQ && !vName.includes(volQ)) return false;

        const brgy = String(t.emergency?.barangayName || "").toLowerCase();
        if (brgyQ && !brgy.includes(brgyQ)) return false;

        return true;
      })
      .sort((a, b) => dateForStatus(b, status).localeCompare(dateForStatus(a, status)));
  }, [filters, status, tasks]);

  const exportCsv = useCallback(() => {
    const s = String(status || "").toUpperCase();
    const stamp = new Date().toISOString().slice(0, 10);

    if (s === "VERIFIED") {
      const header = ["taskId", "emergencyType", "volunteer", "barangay", "completedAt", "verifiedAt", "status"];
      const rows = filtered.map((t) => [
        t.id,
        t.emergency?.emergencyType || "",
        t.volunteer?.name || "",
        t.emergency?.barangayName || "",
        t.completedAt || "",
        t.verifiedAt || "",
        t.status || "",
      ]);
      const csv = header.join(",") + "\n" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      downloadTextFile(`lgu-tasks-completed-${stamp}.csv`, csv, "text/csv");
      return;
    }

    if (s === "CANCELLED") {
      const header = ["taskId", "emergencyType", "originalAssignee", "canceledAt", "canceledBy", "reason"];
      const rows = filtered.map((t) => {
        const c = deriveCancellation(t);
        return [
          t.id,
          t.emergency?.emergencyType || "",
          c.originalAssignee,
          c.canceledAt || "",
          c.canceledBy,
          c.reason,
        ];
      });
      const csv = header.join(",") + "\n" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      downloadTextFile(`lgu-tasks-canceled-${stamp}.csv`, csv, "text/csv");
      return;
    }

    const header = ["taskId", "status", "emergencyType", "volunteer", "updatedAt"];
    const rows = filtered.map((t) => [
      t.id,
      t.status || "",
      t.emergency?.emergencyType || "",
      t.volunteer?.name || "",
      t.updatedAt || "",
    ]);
    const csv = header.join(",") + "\n" + rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    downloadTextFile(`lgu-tasks-${stamp}.csv`, csv, "text/csv");
  }, [filtered, status]);

  return {
    tasks,
    filtered,
    loading,
    error,
    refetch,
    filters,
    setFilters,
    clearFilters: () => setFilters(defaultFilters),
    emergencyTypeOptions,
    exportCsv,
  };
}

