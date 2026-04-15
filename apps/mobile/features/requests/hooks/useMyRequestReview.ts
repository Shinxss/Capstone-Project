import { useCallback, useEffect, useState } from "react";
import type { MyRequestReviewDTO, UpsertMyRequestReviewInput } from "../models/requestReview";
import { fetchMyRequestReview, upsertMyRequestReview } from "../services/requestReviewApi";

type Options = {
  enabled?: boolean;
};

function toErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const maybeAxios = error as { response?: { data?: { message?: unknown } }; message?: unknown };
    const apiMessage = String(maybeAxios.response?.data?.message ?? "").trim();
    if (apiMessage) return apiMessage;
    const genericMessage = String(maybeAxios.message ?? "").trim();
    if (genericMessage) return genericMessage;
  }
  return fallback;
}

export function useMyRequestReview(requestId: string | null | undefined, options?: Options) {
  const normalizedRequestId = String(requestId ?? "").trim();
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<MyRequestReviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !normalizedRequestId) {
      setData(null);
      setError(null);
      return null;
    }

    try {
      const next = await fetchMyRequestReview(normalizedRequestId);
      setData(next);
      setError(null);
      return next;
    } catch (err) {
      setError(toErrorMessage(err, "Failed to load review details"));
      return null;
    }
  }, [enabled, normalizedRequestId]);

  const submitReview = useCallback(
    async (input: UpsertMyRequestReviewInput) => {
      if (!enabled || !normalizedRequestId) {
        throw new Error("Review submission is not available");
      }

      setSubmitting(true);
      try {
        const next = await upsertMyRequestReview(normalizedRequestId, input);
        setData(next);
        setError(null);
        return next;
      } catch (err) {
        const message = toErrorMessage(err, "Failed to submit review");
        setError(message);
        throw new Error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [enabled, normalizedRequestId]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await refresh();
      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [refresh]);

  return {
    data,
    loading,
    submitting,
    error,
    refresh,
    submitReview,
  };
}
