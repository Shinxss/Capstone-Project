import { useCallback, useState } from "react";
import { createEmergencyReport } from "../../emergency/services/emergencyApi";
import type { ReportDraft, ReportSubmitResult } from "../models/report.types";

export function useSubmitReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportSubmitResult | null>(null);

  const submit = useCallback(async (draft: ReportDraft) => {
    if (!draft.type) {
      const message = "Emergency type is required.";
      setError(message);
      throw new Error(message);
    }

    if (!draft.location?.coords) {
      const message = "Location is required.";
      setError(message);
      throw new Error(message);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createEmergencyReport({
        type: draft.type,
        location: {
          coords: {
            latitude: draft.location.coords.latitude,
            longitude: draft.location.coords.longitude,
          },
          label: draft.location.label,
        },
        description: draft.description?.trim() ? draft.description.trim() : undefined,
        photos: draft.photos ?? [],
      });

      setResult(response);
      return response;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to submit report.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, submit };
}
