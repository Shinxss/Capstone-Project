import { api } from "../../../lib/api";
import type { CreateHazardZoneInput, HazardZone } from "../models/hazardZones.types";

export async function fetchHazardZones(limit = 500) {
  const res = await api.get<{ data: HazardZone[] }>("/api/hazard-zones", {
    params: { limit },
  });
  return res.data.data;
}

export async function createHazardZone(input: CreateHazardZoneInput) {
  const res = await api.post<{ data: HazardZone }>("/api/hazard-zones", input);
  return res.data.data;
}

export async function deleteHazardZone(id: string) {
  const res = await api.delete<{ data: { ok: true } }>(`/api/hazard-zones/${id}`);
  return res.data.data;
}

export async function setHazardZoneStatus(id: string, isActive: boolean) {
  const res = await api.patch<{ data: HazardZone }>(`/api/hazard-zones/${id}/status`, {
    isActive,
  });
  return res.data.data;
}
