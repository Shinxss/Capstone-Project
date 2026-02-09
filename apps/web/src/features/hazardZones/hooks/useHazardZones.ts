import { useCallback, useEffect, useState } from "react";
import type { CreateHazardZoneInput, HazardZone } from "../models/hazardZones.types";
import { createHazardZone, fetchHazardZones } from "../services/hazardZones.service";

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

  return { hazardZones, loading, error, refetch, create };
}
