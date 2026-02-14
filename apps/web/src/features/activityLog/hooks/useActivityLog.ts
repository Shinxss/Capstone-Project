import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityLogEntry, ActivityLogFilters } from "../models/activityLog.types";
import { listActivityLogEntries, seedActivityLogIfEmpty } from "../services/activityLog.service";

function toStartOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T00:00:00.000`);
  return d.toISOString();
}

function toEndOfDayIso(dateYmd: string) {
  const d = new Date(`${dateYmd}T23:59:59.999`);
  return d.toISOString();
}

const defaultFilters: ActivityLogFilters = {
  dateFrom: "",
  dateTo: "",
  action: "",
  actor: "",
};

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>(defaultFilters);

  const refresh = useCallback(() => {
    try {
      setError(null);
      seedActivityLogIfEmpty();
      setEntries(listActivityLogEntries());
    } catch (e: any) {
      setError(e?.message || "Failed to load activity log");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const qAction = filters.action.trim().toLowerCase();
    const qActor = filters.actor.trim().toLowerCase();

    const fromIso = filters.dateFrom ? toStartOfDayIso(filters.dateFrom) : "";
    const toIso = filters.dateTo ? toEndOfDayIso(filters.dateTo) : "";

    return entries.filter((e) => {
      if (fromIso && String(e.timestamp) < fromIso) return false;
      if (toIso && String(e.timestamp) > toIso) return false;
      if (qAction && !String(e.action || "").toLowerCase().includes(qAction)) return false;
      if (qActor && !String(e.actor || "").toLowerCase().includes(qActor)) return false;
      return true;
    });
  }, [entries, filters]);

  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(String(e.action || "").trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const actorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) set.add(String(e.actor || "").trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  return {
    entries,
    filtered,
    error,
    filters,
    setFilters,
    actionOptions,
    actorOptions,
    refresh,
    clearFilters: () => setFilters(defaultFilters),
  };
}

