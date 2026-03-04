import { api } from "../../../lib/api";
import type { DispatchTask } from "../../tasks/models/tasks.types";

export async function createDispatchOffers(params: {
  emergencyId: string;
  volunteerIds: string[];
}) {
  const { emergencyId, volunteerIds } = params;
  const res = await api.post<{ count: number; message: string }>("/api/dispatches", {
    emergencyId,
    volunteerIds,
  });
  return res.data;
}

const DEFAULT_TASK_STATUSES = "PENDING,ACCEPTED,DONE,VERIFIED,DECLINED,CANCELLED";

export async function fetchDispatchTasks(params: { emergencyId: string; status?: string }): Promise<DispatchTask[]> {
  const { emergencyId, status } = params;
  const res = await api.get<{ data: DispatchTask[] }>("/api/dispatches", {
    params: {
      status: status || DEFAULT_TASK_STATUSES,
      emergencyId,
    },
  });
  return res.data.data ?? [];
}
