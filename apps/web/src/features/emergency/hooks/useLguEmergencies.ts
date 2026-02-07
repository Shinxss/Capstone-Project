import { useCallback, useEffect, useState } from "react";
import { fetchEmergencyReports } from "../services/emergency.service";
import type { EmergencyReport } from "../models/emergency.types";

export function useLguEmergencies() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmergencyReports(200);
      setReports(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load emergencies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { reports, loading, error, refetch };
}
