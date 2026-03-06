import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../auth/models/session";
import {
  createProfileSummaryFallbackFromUser,
  type ProfileSummary,
} from "../models/profile";
import { getProfileSummary } from "../services/profileApi";

type UseProfileSummaryOptions = {
  enabled?: boolean;
  user?: Partial<AuthUser> | null;
};

export function useProfileSummary(options?: UseProfileSummaryOptions) {
  const enabled = options?.enabled ?? true;
  const fallbackSummary = useMemo(
    () => createProfileSummaryFallbackFromUser(options?.user),
    [options?.user]
  );

  const [data, setData] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const next = await getProfileSummary();
      setData(next);
      setError(null);
    } catch (err: any) {
      setData(null);
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load profile summary");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    summary: data ?? fallbackSummary,
    loading,
    error,
    refresh,
  };
}
