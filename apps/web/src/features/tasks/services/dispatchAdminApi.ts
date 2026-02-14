import { api } from "../../../lib/api";

export type DispatchVolunteer = {
  id: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
};

type DispatchVolunteerDTO = {
  id: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
};

export async function fetchDispatchVolunteers(): Promise<DispatchVolunteer[]> {
  const res = await api.get<{ data: DispatchVolunteerDTO[] }>("/api/users/volunteers", {
    params: { onlyApproved: true, includeInactive: true },
  });
  return (res.data.data ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    status: v.status,
    skill: v.skill ?? "General Volunteer",
    barangay: v.barangay,
    municipality: v.municipality,
  }));
}

export async function createDispatchOffers(params: { emergencyId: string; volunteerIds: string[] }) {
  const res = await api.post<{ count: number; message: string }>("/api/dispatches", params);
  return res.data;
}

