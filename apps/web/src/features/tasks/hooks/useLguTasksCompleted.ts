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
import { useLguTaskHistory, type TaskHistoryFilters } from "./useLguTaskHistory";
import { useLguTasks } from "./useLguTasks";

export function useLguTasksCompleted() {
  const history = useLguTaskHistory("VERIFIED");
  const overview = useLguTasks(TASK_OVERVIEW_STATUSES.join(","));
  const [sort, setSortState] = useState<CompletedTaskSort>("COMPLETED_NEWEST");
  const [page, setPage] = useState(1);
  const {
    setFilters: setHistoryFilters,
    clearFilters: clearHistoryFilters,
    refetch: refetchHistory,
  } = history;
  const { refetch: refetchOverview } = overview;
  const overviewTasks = overview.loading || overview.error ? null : overview.tasks;

  const sorted = useMemo(
    () => sortCompletedTasks(history.filtered, sort),
    [history.filtered, sort],
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

  const updateFilter = useCallback(
    (field: keyof TaskHistoryFilters, value: string) => {
      setPage(1);
      setHistoryFilters((previous) => ({ ...previous, [field]: value }));
    },
    [setHistoryFilters],
  );

  const clearFilters = useCallback(() => {
    setPage(1);
    clearHistoryFilters();
  }, [clearHistoryFilters]);

  const setSort = useCallback((value: CompletedTaskSort) => {
    setPage(1);
    setSortState(value);
  }, []);

  const refetch = useCallback(async () => {
    await Promise.allSettled([refetchHistory(), refetchOverview()]);
  }, [refetchHistory, refetchOverview]);

  const hasActiveFilters = Object.entries(history.filters).some(
    ([key, value]) => (key === "emergencyType" ? value !== "ALL" : Boolean(value)),
  );
  const dateError =
    history.filters.dateFrom &&
    history.filters.dateTo &&
    history.filters.dateFrom > history.filters.dateTo
      ? "Date From must be on or before Date To."
      : null;

  return {
    ...history,
    refetch,
    clearFilters,
    updateFilter,
    hasActiveFilters,
    dateError,
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
