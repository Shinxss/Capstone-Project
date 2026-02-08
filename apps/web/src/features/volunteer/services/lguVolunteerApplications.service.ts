import { api } from "../../../lib/api";
import type {
  VolunteerApplication,
  VolunteerApplicationListResponse,
  VolunteerApplicationStatus,
} from "../models/volunteerApplication.types";

export async function listVolunteerApplications(params: {
  q?: string;
  status?: VolunteerApplicationStatus[];
  page?: number;
  limit?: number;
}): Promise<VolunteerApplicationListResponse> {
  const res = await api.get<VolunteerApplicationListResponse>("/api/volunteer-applications", {
    params: {
      q: params.q || undefined,
      status: params.status?.length ? params.status.join(",") : undefined,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return res.data;
}

export async function getVolunteerApplicationById(id: string): Promise<VolunteerApplication> {
  const res = await api.get<VolunteerApplication>(`/api/volunteer-applications/${id}`);
  return res.data;
}

export async function reviewVolunteerApplication(
  id: string,
  payload: { action: "needs_info" | "verified" | "rejected"; notes?: string }
): Promise<VolunteerApplication> {
  const res = await api.post<VolunteerApplication>(`/api/volunteer-applications/${id}/review`, payload);
  return res.data;
}
