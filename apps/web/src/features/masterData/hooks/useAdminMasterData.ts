import { useCallback, useEffect, useState } from "react";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type { MasterDataRecord, MasterDataTab } from "../models/masterData.types";
import { createMasterData, listMasterData, updateMasterData } from "../services/masterData.service";

export function useAdminMasterData() {
  const [tab, setTab] = useState<MasterDataTab>("emergency-types");
  const [items, setItems] = useState<MasterDataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMasterData(tab);
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load master data");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (payload: Record<string, unknown>) => {
    setBusyId("new");
    try {
      await createMasterData(tab, payload);
      toastSuccess("Master data created.");
      await refresh();
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to create record");
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh, tab]);

  const update = useCallback(async (id: string, payload: Record<string, unknown>) => {
    setBusyId(id);
    try {
      await updateMasterData(tab, id, payload);
      toastSuccess("Master data updated.");
      await refresh();
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to update record");
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh, tab]);

  return {
    tab,
    setTab,
    items,
    loading,
    error,
    busyId,
    refresh,
    create,
    update,
  };
}
