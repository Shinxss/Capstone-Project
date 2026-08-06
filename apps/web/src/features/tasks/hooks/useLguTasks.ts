import { useCallback, useEffect, useState } from "react";
import type { DispatchTask } from "../models/tasks.types";
import { fetchLguTasksByStatus } from "../services/tasksApi";

export function useLguTasks(status: string) {
  const [tasks, setTasks] = useState<DispatchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLguTasksByStatus(status);
      setTasks(data);
    } catch {
      setError("Unable to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tasks, loading, error, refetch };
}
