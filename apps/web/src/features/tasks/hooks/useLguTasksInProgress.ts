import { useMemo } from "react";
import type { DispatchTask } from "../models/tasks.types";
import { useLguTasks } from "./useLguTasks";

type EmergencyTaskGroup = {
  emergency: DispatchTask["emergency"];
  offers: DispatchTask[];
};

export function useLguTasksInProgress() {
  const { tasks, loading, error, refetch } = useLguTasks("ACCEPTED");

  const groups = useMemo(() => {
    const byEmergency: Record<string, EmergencyTaskGroup> = {};
    for (const task of tasks) {
      const emergencyId = task.emergency?.id;
      if (!emergencyId) continue;

      if (!byEmergency[emergencyId]) {
        byEmergency[emergencyId] = {
          emergency: task.emergency,
          offers: [],
        };
      }
      byEmergency[emergencyId].offers.push(task);
    }
    return Object.values(byEmergency);
  }, [tasks]);

  return {
    loading,
    error,
    refetch,
    groups,
  };
}
