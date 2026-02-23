import { api } from "@/lib/api";
import type { MasterDataRecord, MasterDataTab } from "../models/masterData.types";

export async function listMasterData(tab: MasterDataTab) {
  const res = await api.get<{ items: MasterDataRecord[] }>(`/api/admin/masterdata/${tab}`);
  return res.data.items ?? [];
}

export async function createMasterData(tab: MasterDataTab, payload: Record<string, unknown>) {
  const res = await api.post<{ item: MasterDataRecord }>(`/api/admin/masterdata/${tab}`, payload);
  return res.data.item;
}

export async function updateMasterData(tab: MasterDataTab, id: string, payload: Record<string, unknown>) {
  const res = await api.patch<{ item: MasterDataRecord }>(`/api/admin/masterdata/${tab}/${id}`, payload);
  return res.data.item;
}
