import { useCallback, useEffect, useState } from "react";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type { AdminBarangay } from "../models/adminBarangays.types";
import {
  activateAdminBarangay,
  createAdminBarangay,
  deactivateAdminBarangay,
  listAdminBarangays,
  updateAdminBarangay,
} from "../services/adminBarangays.service";

export function useAdminBarangays() {
  const [items, setItems] = useState<AdminBarangay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminBarangays({ q: q.trim() || undefined, page: 1, limit: 200 });
      setItems(data.items);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load barangays");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: {
    name: string;
    city: string;
    province: string;
    code?: string;
    geometry?: { type: "Polygon" | "MultiPolygon"; coordinates: unknown[] };
  }) => {
    setBusyId("new");
    try {
      await createAdminBarangay(input);
      toastSuccess("Barangay created.");
      await refresh();
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to create barangay");
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<{ name: string; city: string; province: string; code?: string }>) => {
    setBusyId(id);
    try {
      await updateAdminBarangay(id, patch);
      toastSuccess("Barangay updated.");
      await refresh();
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to update barangay");
      throw err;
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  const toggleActive = useCallback(async (item: AdminBarangay) => {
    setBusyId(item.id);
    try {
      if (item.isActive) {
        await deactivateAdminBarangay(item.id);
        toastSuccess("Barangay deactivated.");
      } else {
        await activateAdminBarangay(item.id);
        toastSuccess("Barangay activated.");
      }
      await refresh();
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to update barangay status");
    } finally {
      setBusyId(null);
    }
  }, [refresh]);

  return {
    items,
    loading,
    error,
    busyId,
    q,
    setQ,
    refresh,
    create,
    update,
    toggleActive,
  };
}
