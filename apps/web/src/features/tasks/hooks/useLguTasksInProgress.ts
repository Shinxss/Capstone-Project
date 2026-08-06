import { useCallback, useMemo, useState } from "react";
import { EMPTY_IN_PROGRESS_FILTERS, IN_PROGRESS_PAGE_SIZE } from "../in-progress/constants/inProgressTasks.constants";
import type { InProgressSort, InProgressTaskFilters, InProgressTaskGroup } from "../in-progress/types/inProgressTask.types";
import { buildInProgressGroups, calculateInProgressStats, filterInProgressGroups, getInProgressFilterOptions, hasActiveInProgressFilters, sortInProgressGroups } from "../in-progress/utils/inProgressTask.utils";
import { useLguTasks } from "./useLguTasks";

export function useLguTasksInProgress() {
  const { tasks, loading, error, refetch } = useLguTasks("ACCEPTED");
  const [filters, setFilters] = useState<InProgressTaskFilters>(EMPTY_IN_PROGRESS_FILTERS);
  const [sort, setSort] = useState<InProgressSort>("LAST_UPDATED");
  const [page, setPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<InProgressTaskGroup | null>(null);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  const groups = useMemo(() => buildInProgressGroups(tasks, referenceTime), [referenceTime, tasks]);
  const stats = useMemo(() => calculateInProgressStats(groups), [groups]);
  const filterOptions = useMemo(() => getInProgressFilterOptions(groups), [groups]);
  const filteredGroups = useMemo(() => sortInProgressGroups(filterInProgressGroups(groups, filters), sort), [filters, groups, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / IN_PROGRESS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleGroups = useMemo(() => filteredGroups.slice((currentPage - 1) * IN_PROGRESS_PAGE_SIZE, currentPage * IN_PROGRESS_PAGE_SIZE), [currentPage, filteredGroups]);
  const pagination = {
    page: currentPage,
    pageSize: IN_PROGRESS_PAGE_SIZE,
    totalItems: filteredGroups.length,
    totalPages,
    startItem: filteredGroups.length === 0 ? 0 : (currentPage - 1) * IN_PROGRESS_PAGE_SIZE + 1,
    endItem: Math.min(currentPage * IN_PROGRESS_PAGE_SIZE, filteredGroups.length),
  };

  const updateFilter = useCallback(<K extends keyof InProgressTaskFilters>(key: K, value: InProgressTaskFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_IN_PROGRESS_FILTERS);
    setPage(1);
  }, []);

  const changeSort = useCallback((value: InProgressSort) => {
    setSort(value);
    setPage(1);
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
    setReferenceTime(Date.now());
  }, [refetch]);

  return {
    loading,
    error,
    refresh,
    stats,
    filters,
    filterOptions,
    updateFilter,
    clearFilters,
    filtersActive: hasActiveInProgressFilters(filters),
    sort,
    changeSort,
    groups: visibleGroups,
    pagination,
    setPage,
    selectedGroup,
    setSelectedGroup,
    referenceTime,
  };
}
