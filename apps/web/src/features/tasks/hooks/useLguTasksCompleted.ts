import { useCallback, useMemo, useState } from "react";
import {
  COMPLETED_TASKS_PAGE_SIZE,
  TASK_OVERVIEW_STATUSES,
} from "../completed/constants/completedTasks.constants";
import { useCompletedTaskStats } from "../completed/hooks/useCompletedTaskStats";
import type { CompletedTaskSort } from "../completed/types/completedTask.types";
import {
  paginateCompletedTasks,
  sortCompletedTasks,
} from "../completed/utils/completedTask.utils";
import { useLguTaskHistory } from "./useLguTaskHistory";
import { useLguTasks } from "./useLguTasks";

export function useLguTasksCompleted() {
  const history = useLguTaskHistory("VERIFIED");
  const overview = useLguTasks(TASK_OVERVIEW_STATUSES.join(","));
  const [sort, setSortState] = useState<CompletedTaskSort>("COMPLETED_NEWEST");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    clearFilters: clearHistoryFilters,
    refetch: refetchHistory,
  } = history;
  const { refetch: refetchOverview } = overview;
  const overviewTasks = overview.loading || overview.error ? null : overview.tasks;

  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history.filtered;
    return history.filtered.filter((t) => {
      const taskId = String(t.id || "").toLowerCase();
      const volunteer = String(t.volunteer?.name || "").toLowerCase();
      const barangay = String(t.emergency?.barangayName || "").toLowerCase();
      const emergencyType = String(t.emergency?.emergencyType || "").toLowerCase();
      return taskId.includes(q) || volunteer.includes(q) || barangay.includes(q) || emergencyType.includes(q);
    });
  }, [history.filtered, searchQuery]);

  const sorted = useMemo(
    () => sortCompletedTasks(searched, sort),
    [searched, sort],
  );
  const { items: visibleTasks, pagination } = useMemo(
    () => paginateCompletedTasks(sorted, page, COMPLETED_TASKS_PAGE_SIZE),
    [page, sorted],
  );
  const barangayOptions = useMemo(
    () =>
      Array.from(
        new Set(
          history.tasks
            .map((task) => String(task.emergency?.barangayName ?? "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [history.tasks],
  );
  const { statistics, statusCounts } = useCompletedTaskStats(history.tasks, overviewTasks);

  const updateSearchQuery = useCallback((value: string) => {
    setPage(1);
    setSearchQuery(value);
  }, []);

  const clearFilters = useCallback(() => {
    setPage(1);
    setSearchQuery("");
    clearHistoryFilters();
  }, [clearHistoryFilters]);

  const setSort = useCallback((value: CompletedTaskSort) => {
    setPage(1);
    setSortState(value);
  }, []);

  const refetch = useCallback(async () => {
    await Promise.allSettled([refetchHistory(), refetchOverview()]);
  }, [refetchHistory, refetchOverview]);

  const hasActiveFilters = searchQuery.trim().length > 0 || Object.entries(history.filters).some(
    ([key, value]) => (key === "emergencyType" ? value !== "ALL" : Boolean(value)),
  );
  const dateError = null;

  return {
    ...history,
    refetch,
    clearFilters,
    searchQuery,
    updateSearchQuery,
    hasActiveFilters,
    dateError,
    filtered: searched,
    barangayOptions,
    visibleTasks,
    pagination,
    page: pagination.page,
    setPage,
    sort,
    setSort,
    statistics,
    statusCounts,
  };
}
