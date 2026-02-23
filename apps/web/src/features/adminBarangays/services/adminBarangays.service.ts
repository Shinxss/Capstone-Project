import { api } from "@/lib/api";
import type { AdminBarangay } from "../models/adminBarangays.types";

type BarangayDto = {
  _id: string;
  name: string;
  city: string;
  province: string;
  code?: string;
  isActive: boolean;
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown[];
  };
};

function mapBarangay(dto: BarangayDto): AdminBarangay {
  return {
    id: dto._id,
    name: dto.name,
    city: dto.city,
    province: dto.province,
    code: dto.code,
    isActive: dto.isActive,
    geometry: dto.geometry,
  };
}

export async function listAdminBarangays(params?: { q?: string; isActive?: "true" | "false" | ""; page?: number; limit?: number }) {
  const res = await api.get<{ items: BarangayDto[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    "/api/admin/barangays",
    { params }
  );

  return {
    items: (res.data.items ?? []).map(mapBarangay),
    pagination: res.data.pagination,
  };
}

export async function createAdminBarangay(input: {
  name: string;
  city: string;
  province: string;
  code?: string;
  geometry?: { type: "Polygon" | "MultiPolygon"; coordinates: unknown[] };
}) {
  const res = await api.post<{ item: BarangayDto }>("/api/admin/barangays", input);
  return mapBarangay(res.data.item);
}

export async function updateAdminBarangay(id: string, patch: Partial<{ name: string; city: string; province: string; code?: string }>) {
  const res = await api.patch<{ item: BarangayDto }>(`/api/admin/barangays/${id}`, patch);
  return mapBarangay(res.data.item);
}

export async function deactivateAdminBarangay(id: string) {
  const res = await api.post<{ item: BarangayDto }>(`/api/admin/barangays/${id}/deactivate`);
  return mapBarangay(res.data.item);
}

export async function activateAdminBarangay(id: string) {
  const res = await api.post<{ item: BarangayDto }>(`/api/admin/barangays/${id}/activate`);
  return mapBarangay(res.data.item);
}
