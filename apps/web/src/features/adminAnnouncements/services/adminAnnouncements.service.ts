import { api } from "@/lib/api";
import type {
  AdminAnnouncement,
  AdminAnnouncementDraftInput,
  AdminAnnouncementStatus,
  AdminAnnouncementAudience,
} from "../models/adminAnnouncements.types";

type AnnouncementDto = {
  _id: string;
  title: string;
  body: string;
  audience: AdminAnnouncementAudience;
  status: AdminAnnouncementStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
};

function mapAnnouncement(dto: AnnouncementDto): AdminAnnouncement {
  return {
    id: dto._id,
    title: dto.title,
    body: dto.body,
    audience: dto.audience,
    status: dto.status,
    publishedAt: dto.publishedAt ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    createdBy: dto.createdBy
      ? {
          id: dto.createdBy._id,
          username: dto.createdBy.username,
          firstName: dto.createdBy.firstName,
          lastName: dto.createdBy.lastName,
          role: dto.createdBy.role,
        }
      : null,
  };
}

export async function listAdminAnnouncements(params?: {
  page?: number;
  limit?: number;
  status?: AdminAnnouncementStatus | "";
  q?: string;
}) {
  const res = await api.get<{
    items: AnnouncementDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/api/admin/announcements", { params });

  return {
    items: (res.data.items ?? []).map(mapAnnouncement),
    pagination: res.data.pagination,
  };
}

export async function createAdminAnnouncement(input: AdminAnnouncementDraftInput) {
  const res = await api.post<{ item: AnnouncementDto }>("/api/admin/announcements", input);
  return mapAnnouncement(res.data.item);
}

export async function updateAdminAnnouncement(id: string, patch: Partial<AdminAnnouncementDraftInput>) {
  const res = await api.patch<{ item: AnnouncementDto }>(`/api/admin/announcements/${id}`, patch);
  return mapAnnouncement(res.data.item);
}

export async function publishAdminAnnouncement(id: string) {
  const res = await api.post<{ item: AnnouncementDto }>(`/api/admin/announcements/${id}/publish`);
  return mapAnnouncement(res.data.item);
}

export async function unpublishAdminAnnouncement(id: string) {
  const res = await api.post<{ item: AnnouncementDto }>(`/api/admin/announcements/${id}/unpublish`);
  return mapAnnouncement(res.data.item);
}

export async function deleteAdminAnnouncement(id: string) {
  await api.delete(`/api/admin/announcements/${id}`);
}
