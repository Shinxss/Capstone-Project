import { api } from "../../../lib/api";
import type {
  VolunteerApplication,
  VolunteerApplicationListResponse,
  VolunteerApplicationStatus,
} from "../models/volunteerApplication.types";

function resolveAvatarUrl(value?: string) {
  const avatar = String(value ?? "").trim();
  if (!avatar) return undefined;
  if (/^https?:\/\//i.test(avatar)) return avatar;

  const base = String(api.defaults.baseURL ?? "").trim();
  if (!base) return avatar;

  try {
    const baseUrl = new URL(base);
    const origin = `${baseUrl.protocol}//${baseUrl.host}`;
    return new URL(avatar, origin).toString();
  } catch {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = avatar.startsWith("/") ? avatar : `/${avatar}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}

function mapVolunteerApplication(item: VolunteerApplication): VolunteerApplication {
  return {
    ...item,
    avatarUrl: resolveAvatarUrl(item.avatarUrl),
  };
}

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
  return {
    ...res.data,
    items: (res.data.items ?? []).map(mapVolunteerApplication),
  };
}

export async function getVolunteerApplicationById(id: string): Promise<VolunteerApplication> {
  const res = await api.get<VolunteerApplication>(`/api/volunteer-applications/${id}`);
  return mapVolunteerApplication(res.data);
}

export async function reviewVolunteerApplication(
  id: string,
  payload: { action: "needs_info" | "verified" | "rejected"; notes?: string }
): Promise<VolunteerApplication> {
  const res = await api.post<VolunteerApplication>(`/api/volunteer-applications/${id}/review`, payload);
  return mapVolunteerApplication(res.data);
}
