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

    const photos = draft.photos ?? [];
    const hasUploading = photos.some((photo) => Boolean(photo.uploading));
    const hasMissingUrl = photos.some((photo) => !photo.url);
    if (hasUploading || hasMissingUrl) {
      const message = "Please wait for photo uploads to finish or remove failed photos.";
      setError(message);
      throw new Error(message);
    }

    const locationLabel = draft.locationText?.trim() || draft.location?.label?.trim();
    const photoUrls = photos.map((photo) => photo.url).filter((url): url is string => Boolean(url));
    if (photoUrls.length < 3) {
      const message = "Please upload at least 3 proof images.";
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
          label: locationLabel,
        },
        description: draft.description?.trim() ? draft.description.trim() : undefined,
        photos: photoUrls,
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
