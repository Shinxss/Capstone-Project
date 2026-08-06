import { Link } from "react-router-dom";
import { TASK_STATUS_TABS, type TaskStatusTabKey } from "../constants/taskStatus.constants";

type Props = {
  active: TaskStatusTabKey;
  counts?: Partial<Record<TaskStatusTabKey, number | null>>;
};

export default function TaskStatusTabs({ active, counts = {} }: Props) {
  return (
    <nav aria-label="Task status" className="overflow-x-auto border-b border-slate-200 dark:border-[#1C2940]">
      <div className="flex min-w-max items-center gap-1 px-2 sm:px-4">
        {TASK_STATUS_TABS.map((tab) => {
          const isActive = tab.key === active;
          const count = counts[tab.key];
          return (
            <Link key={tab.key} to={tab.to} aria-current={isActive ? "page" : undefined} className={`relative inline-flex h-13 items-center gap-2 px-3 text-sm font-semibold transition focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:px-4 ${isActive ? "text-red-600 dark:text-red-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}>
              {tab.label}
              {count !== undefined && count !== null ? <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${isActive ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300" : "bg-slate-100 text-slate-600 dark:bg-[#162238] dark:text-slate-300"}`}>{count > 999 ? "999+" : count}</span> : null}
              {isActive ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-red-600" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
