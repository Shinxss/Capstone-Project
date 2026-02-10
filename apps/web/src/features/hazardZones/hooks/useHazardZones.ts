import { useCallback, useEffect, useState } from "react";
import type { CreateHazardZoneInput, HazardZone } from "../models/hazardZones.types";
import {
  createHazardZone,
  deleteHazardZone,
  fetchHazardZones,
  setHazardZoneStatus,
} from "../services/hazardZones.service";

export function useHazardZones() {
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHazardZones();
      setHazardZones(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch hazard zones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(async (payload: CreateHazardZoneInput) => {
    const created = await createHazardZone(payload);
    setHazardZones((prev) => [created, ...prev]);
    return created;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteHazardZone(id);
    setHazardZones((prev) => prev.filter((z) => String(z._id) !== String(id)));
  }, []);

  const setStatus = useCallback(async (id: string, isActive: boolean) => {
    const updated = await setHazardZoneStatus(id, isActive);
    setHazardZones((prev) =>
      prev.map((z) => (String(z._id) === String(id) ? { ...z, ...updated } : z))
    );
    return updated;
  }, []);

  return { hazardZones, loading, error, refetch, create, remove, setStatus };
}
