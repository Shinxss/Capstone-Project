import { useState } from "react";
import type { DispatchTask } from "../models/tasks.types";
import { useLguTasksCompleted } from "../hooks/useLguTasksCompleted";
import CompletedTaskDetailsModal from "../completed/components/CompletedTaskDetailsModal";
import CompletedTaskStats from "../completed/components/CompletedTaskStats";
import CompletedTasksEmptyState from "../completed/components/CompletedTasksEmptyState";
import CompletedTasksErrorState from "../completed/components/CompletedTasksErrorState";
import CompletedTasksFilters from "../completed/components/CompletedTasksFilters";

import CompletedTasksSkeleton from "../completed/components/CompletedTasksSkeleton";
import CompletedTasksTable from "../completed/components/CompletedTasksTable";


type Props = ReturnType<typeof useLguTasksCompleted>;

export default function LguTasksCompletedView({
  loading,
  error,
  refetch,
  exportCsv,
  filtered,
  visibleTasks,
  searchQuery,
  updateSearchQuery,
  clearFilters,
  hasActiveFilters,
  dateError,
  statistics,
  pagination,
  setPage,
  sort,
  setSort,
}: Props) {
  const [selectedTask, setSelectedTask] = useState<DispatchTask | null>(null);

  const refresh = () => void refetch();
  const exportDisabled = filtered.length === 0 || Boolean(dateError);

  return (
    <main className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">

      {loading ? <CompletedTasksSkeleton /> : null}

      {!loading && error ? <CompletedTasksErrorState onRetry={refresh} /> : null}

      {!loading && !error ? (
        <>
          <CompletedTaskStats statistics={statistics} />
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1C2940] dark:bg-[#0B1220]">
            <div className="p-4 sm:p-5">
              <CompletedTasksFilters
                searchQuery={searchQuery}
                exportDisabled={exportDisabled}
                hasActiveFilters={hasActiveFilters}
                onSearchChange={updateSearchQuery}
                onClear={clearFilters}
                onExport={exportCsv}
              />
            </div>

            {filtered.length === 0 ? (
              <CompletedTasksEmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
            ) : (
              <CompletedTasksTable
                tasks={visibleTasks}
                pagination={pagination}
                sort={sort}
                onSortChange={setSort}
                onPageChange={setPage}
                onViewDetails={setSelectedTask}
              />
            )}
          </section>
        </>
      ) : null}

      <CompletedTaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </main>
  );
}
