import { api } from "../../../lib/api";

export async function dispatchToVolunteers(emergencyId: string, volunteerIds: string[]) {
  const res = await api.post<{ data: { created: number; skipped: number; offerIds: string[] } }>(
    "/api/dispatches",
    { emergencyId, volunteerIds }
  );

  return res.data?.data;
}
