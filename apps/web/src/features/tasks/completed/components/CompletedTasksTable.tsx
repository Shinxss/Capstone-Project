import { ClipboardCheck } from "lucide-react";
import type { DispatchTask } from "../../models/tasks.types";
import { COMPLETED_TASK_SORT_OPTIONS } from "../constants/completedTasks.constants";
import type { CompletedTaskSort, PaginationMetadata } from "../types/completedTask.types";
import CompletedTaskCard from "./CompletedTaskCard";
import CompletedTaskRow from "./CompletedTaskRow";
import CompletedTasksPagination from "./CompletedTasksPagination";

type Props = {
  tasks: DispatchTask[];
  pagination: PaginationMetadata;
  sort: CompletedTaskSort;
  onSortChange: (sort: CompletedTaskSort) => void;
  onPageChange: (page: number) => void;
  onViewDetails: (task: DispatchTask) => void;
};

function isCompletedTaskSort(value: string): value is CompletedTaskSort {
  return COMPLETED_TASK_SORT_OPTIONS.some((option) => option.value === value);
}

export default function CompletedTasksTable({
  tasks,
  pagination,
  sort,
  onSortChange,
  onPageChange,
  onViewDetails,
}: Props) {
  return (
    <div>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ClipboardCheck size={16} className="text-red-600" aria-hidden="true" />
          <span><strong className="text-slate-900 dark:text-white">{pagination.totalItems}</strong> results</span>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sort by:
          <select
            value={sort}
            onChange={(event) => {
              if (isCompletedTaskSort(event.target.value)) onSortChange(event.target.value);
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-[#293852] dark:bg-[#0E1626] dark:text-slate-200 dark:focus:ring-red-500/15"
          >
            {COMPLETED_TASK_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="hidden xl:block">
        <table className="w-full table-fixed text-left" aria-label="Completed tasks">
          <colgroup>
            <col className="w-[13%]" /><col className="w-[10%]" /><col className="w-[15%]" />
            <col className="w-[16%]" /><col className="w-[13%]" /><col className="w-[13%]" />
            <col className="w-[9%]" /><col className="w-[11%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-[#101A2C] dark:text-slate-400">
            <tr>
              <th scope="col" className="px-3 py-3">Task ID</th>
              <th scope="col" className="px-3 py-3">Emergency</th>
              <th scope="col" className="px-3 py-3">Volunteer</th>
              <th scope="col" className="px-3 py-3">Location / Barangay</th>
              <th scope="col" className="px-3 py-3">Completed</th>
              <th scope="col" className="px-3 py-3">Verified</th>
              <th scope="col" className="px-3 py-3">Status</th>
              <th scope="col" className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>{tasks.map((task) => <CompletedTaskRow key={task.id} task={task} onViewDetails={onViewDetails} />)}</tbody>
        </table>
      </div>

      <div className="grid gap-3 border-t border-slate-100 bg-slate-50/50 p-3 dark:border-[#1C2940] dark:bg-[#08101D] sm:p-4 xl:hidden">
        {tasks.map((task) => <CompletedTaskCard key={task.id} task={task} onViewDetails={onViewDetails} />)}
      </div>

      <CompletedTasksPagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
