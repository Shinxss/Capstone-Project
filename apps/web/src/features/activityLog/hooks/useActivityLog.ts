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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>(defaultFilters);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      setError(null);
      seedActivityLogIfEmpty();
      setEntries(listActivityLogEntries());
    } catch (e: any) {
      setError(e?.message || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const qAction = filters.action.trim().toLowerCase();
    const qActor = filters.actor.trim().toLowerCase();
    const qSearch = search.trim().toLowerCase();

    const fromIso = filters.dateFrom ? toStartOfDayIso(filters.dateFrom) : "";
    const toIso = filters.dateTo ? toEndOfDayIso(filters.dateTo) : "";

    return entries.filter((e) => {
      if (fromIso && String(e.timestamp) < fromIso) return false;
      if (toIso && String(e.timestamp) > toIso) return false;
      if (qAction && !String(e.action || "").toLowerCase().includes(qAction)) return false;
      if (qActor && !String(e.actor || "").toLowerCase().includes(qActor)) return false;

      if (qSearch) {
        const haystack = [
          e.actor,
          e.action,
          e.entityType,
          e.entityId,
          e.timestamp ? new Date(e.timestamp).toLocaleString() : "",
        ]
          .map((part) => String(part || "").toLowerCase())
          .join(" ");

        if (!haystack.includes(qSearch)) return false;
      }

      return true;
    });
  }, [entries, filters, search]);

  useEffect(() => {
    setPage(1);
  }, [filters, search, pageSize]);

  const pagination = useMemo(() => {
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      totalItems,
      totalPages,
      page: safePage,
      pageSize,
      startIndex,
      endIndex,
    };
  }, [filtered.length, page, pageSize]);

  const paginated = useMemo(() => {
    return filtered.slice(pagination.startIndex, pagination.endIndex);
  }, [filtered, pagination.startIndex, pagination.endIndex]);

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
    paginated,
    loading,
    error,
    filters,
    setFilters,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    actionOptions,
    actorOptions,
    refresh,
    clearFilters: () => {
      setFilters(defaultFilters);
      setSearch("");
      setPage(1);
    },
  };
}
