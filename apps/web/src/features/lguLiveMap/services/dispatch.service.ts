import { api } from "../../../lib/api";

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
