import { useCallback, useEffect, useRef, useState } from "react";
import type { VolunteerApplicationRecord } from "../models/volunteerApplication.model";
import { volunteerApplicationService } from "../services/volunteerApplication.service";

type UseMyVolunteerApplicationOptions = {
  enabled?: boolean;
};

export function useMyVolunteerApplication(options?: UseMyVolunteerApplicationOptions) {
  const enabled = options?.enabled ?? true;
  const [application, setApplication] = useState<VolunteerApplicationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setApplication(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const data = await volunteerApplicationService.getLatest();
      setApplication(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load volunteer application";
      setError(message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    application,
    loading,
    error,
    refresh,
  };
}
