import { api } from "@/lib/api";
import type { AdminUserItem, AdminUsersListResponse, PortalAdminTier, PortalUserRole } from "../models/adminUsers.types";

type AdminUserDto = Omit<AdminUserItem, "id"> & { _id: string };

function mapUser(dto: AdminUserDto): AdminUserItem {
  return {
    id: dto._id,
    username: dto.username,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: dto.role,
    adminTier: dto.adminTier,
    lguName: dto.lguName,
    lguPosition: dto.lguPosition,
    barangay: dto.barangay,
    municipality: dto.municipality,
    volunteerStatus: dto.volunteerStatus,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function listAdminUsers(params: {
  q?: string;
  role?: PortalUserRole | "";
  adminTier?: PortalAdminTier | "";
  barangay?: string;
  isActive?: "true" | "false" | "";
  page?: number;
  limit?: number;
}) {
  const res = await api.get<{ items: AdminUserDto[]; pagination: AdminUsersListResponse["pagination"] }>("/api/admin/users", {
    params,
  });

  return {
    items: (res.data.items ?? []).map(mapUser),
    pagination: res.data.pagination,
  };
}

export async function createAdminUser(input: {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: "LGU" | "ADMIN";
  barangay?: string;
  lguName?: string;
  lguPosition?: string;
}) {
  const res = await api.post<{ item: AdminUserDto }>("/api/admin/users", input);
  return mapUser(res.data.item);
}

export async function updateAdminUser(id: string, patch: Record<string, unknown>) {
  const res = await api.patch<{ item: AdminUserDto }>(`/api/admin/users/${id}`, patch);
  return mapUser(res.data.item);
}

export async function suspendAdminUser(id: string) {
  const res = await api.post<{ item: AdminUserDto }>(`/api/admin/users/${id}/suspend`);
  return mapUser(res.data.item);
}

export async function reactivateAdminUser(id: string) {
  const res = await api.post<{ item: AdminUserDto }>(`/api/admin/users/${id}/reactivate`);
  return mapUser(res.data.item);
}
