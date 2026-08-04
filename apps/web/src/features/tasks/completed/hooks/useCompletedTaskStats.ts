import { useMemo } from "react";
import type { DispatchTask } from "../../models/tasks.types";
import {
  calculateCompletedTaskStatistics,
  calculateTaskStatusCounts,
} from "../utils/completedTask.utils";

export function useCompletedTaskStats(
  completedTasks: DispatchTask[],
  overviewTasks: DispatchTask[] | null,
) {
  const statistics = useMemo(
    () => calculateCompletedTaskStatistics(completedTasks, overviewTasks),
    [completedTasks, overviewTasks],
  );

  const statusCounts = useMemo(
    () => calculateTaskStatusCounts(completedTasks.length, overviewTasks),
    [completedTasks.length, overviewTasks],
  );

  return { statistics, statusCounts };
}
