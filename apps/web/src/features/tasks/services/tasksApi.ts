import { api } from "../../../lib/api";
import type { DispatchTask } from "../models/tasks.types";

type ListResp = { data: DispatchTask[]; count?: number };

type OneResp = { data: DispatchTask };

export async function fetchLguTasksByStatus(status: string) {
  const res = await api.get<ListResp>(`/api/dispatches`, {
    params: { status },
  });
  return res.data.data ?? [];
}

export async function verifyTask(dispatchId: string) {
  const res = await api.patch<OneResp>(`/api/dispatches/${dispatchId}/verify`, {});
  return res.data.data;
}
