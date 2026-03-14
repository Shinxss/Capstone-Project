import { api } from "@/lib/api";
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementDraftInput,
  AnnouncementStatus,
} from "../models/announcements.types";

type AnnouncementDto = {
  _id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapAnnouncement(dto: AnnouncementDto): Announcement {
  return {
    id: dto._id,
    title: dto.title,
    body: dto.body,
    audience: dto.audience,
    status: dto.status,
    publishedAt: dto.publishedAt ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function listAnnouncements(params?: {
  page?: number;
  limit?: number;
  status?: AnnouncementStatus | "";
  audience?: AnnouncementAudience | "";
  q?: string;
}) {
  const query = {
    page: params?.page,
    limit: params?.limit,
    status: params?.status || undefined,
    audience: params?.audience || undefined,
    q: params?.q?.trim() ? params.q.trim() : undefined,
  };

  const res = await api.get<{
    items: AnnouncementDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/api/announcements", { params: query });

  return {
    items: (res.data.items ?? []).map(mapAnnouncement),
    pagination: res.data.pagination,
  };
}

export async function listPublishedAnnouncements() {
  const res = await api.get<{ items: AnnouncementDto[] }>("/api/announcements/feed");
  return (res.data.items ?? []).map(mapAnnouncement);
}

export async function createAnnouncement(input: AnnouncementDraftInput) {
  const res = await api.post<{ item: AnnouncementDto }>("/api/announcements", input);
  return mapAnnouncement(res.data.item);
}

export async function updateAnnouncement(id: string, patch: Partial<AnnouncementDraftInput>) {
  const res = await api.patch<{ item: AnnouncementDto }>(`/api/announcements/${id}`, patch);
  return mapAnnouncement(res.data.item);
}

export async function publishAnnouncement(id: string) {
  const res = await api.post<{ item: AnnouncementDto }>(`/api/announcements/${id}/publish`);
  return mapAnnouncement(res.data.item);
}

export async function unpublishAnnouncement(id: string) {
  const res = await api.post<{ item: AnnouncementDto }>(`/api/announcements/${id}/unpublish`);
  return mapAnnouncement(res.data.item);
}

export async function deleteAnnouncement(id: string) {
  await api.delete(`/api/announcements/${id}`);
}
