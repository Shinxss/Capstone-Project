import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import type {
  Achievement,
  AchievementSummary,
  AchievementsResponse,
  UserProgression,
} from "../models/achievement.types";
import { getMyAchievements } from "../services/achievementsApi";

type UseAchievementsOptions = {
  enabled?: boolean;
  loadOnMount?: boolean;
};

const EMPTY_SUMMARY: AchievementSummary = {
  unlocked: 0,
  total: 0,
  percent: 0,
};

const INITIAL_PROGRESSION: UserProgression = {
  lifetimeXp: 0,
  currentLevel: 1,
  currentLevelTitle: "First Step",
  currentLevelStartXp: 0,
  nextLevel: 2,
  nextLevelTitle: "Community Helper",
  nextLevelRequiredXp: 150,
  xpIntoCurrentLevel: 0,
  xpRequiredForNextLevel: 150,
  xpRemainingToNextLevel: 150,
  progressPercent: 0,
  maxLevel: false,
};

function getLoadErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const payload = error.response?.data;
    if (payload && typeof payload === "object" && "message" in payload) {
      const message = String((payload as { message?: unknown }).message ?? "").trim();
      if (message) return message;
    }
  }
  return error instanceof Error && error.message ? error.message : "Unable to load achievements.";
}

export function useAchievements(options?: UseAchievementsOptions) {
  const enabled = options?.enabled ?? true;
  const loadOnMount = options?.loadOnMount ?? true;
  const [data, setData] = useState<AchievementsResponse | null>(null);
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
      const response = await getMyAchievements();
      setData(response);
      setError(null);
    } catch (loadError: unknown) {
      setError(getLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (loadOnMount || !enabled) {
      void refresh();
    }
  }, [enabled, loadOnMount, refresh]);

  const achievements = data?.achievements ?? [];
  const unlockedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked),
    [achievements]
  );
  const lockedAchievements = useMemo(
    () => achievements.filter((achievement) => !achievement.unlocked),
    [achievements]
  );

  return {
    summary: data?.summary ?? EMPTY_SUMMARY,
    progression: data?.progression ?? INITIAL_PROGRESSION,
    achievements,
    unlockedAchievements,
    lockedAchievements,
    loading,
    error,
    refresh,
  } satisfies {
    summary: AchievementSummary;
    progression: UserProgression;
    achievements: Achievement[];
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  };
}
