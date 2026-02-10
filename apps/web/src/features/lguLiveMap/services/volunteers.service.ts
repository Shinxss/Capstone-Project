import { api } from "../../../lib/api";
import type { Volunteer } from "../models/lguLiveMap.types";

// Response shape from the backend
type DispatchVolunteerDTO = {
  id: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
};

export async function fetchDispatchVolunteers(): Promise<Volunteer[]> {
  const res = await api.get<{ data: DispatchVolunteerDTO[] }>("/api/users/volunteers", {
    params: { onlyApproved: true, includeInactive: true },
  });

  return (res.data.data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    // backend has no BUSY state (busy is per-task), keep it as available/offline
    status: v.status,
    skill: v.skill ?? "General Volunteer",
    barangayName: v.barangay,
    municipality: v.municipality,
    // lng/lat intentionally missing until mobile location is wired
  }));
}
