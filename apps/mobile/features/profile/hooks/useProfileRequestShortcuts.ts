import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMyRequestCounts } from "../../requests/hooks/useMyRequestCounts";
import type { ProfileRequestShortcutTab } from "../models/profile";

const SHORTCUT_SEEN_STORAGE_PREFIX = "lifeline.more.shortcuts.seen";

const DEFAULT_SEEN_SHORTCUT_COUNTS: Record<ProfileRequestShortcutTab, number> = {
  assigned: 0,
  en_route: 0,
  arrived: 0,
  resolved: 0,
};

function normalizeSeenShortcutCounts(raw: unknown): Record<ProfileRequestShortcutTab, number> {
  const source = (raw ?? {}) as Partial<Record<ProfileRequestShortcutTab, unknown>>;

  const toCount = (value: unknown) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  };

  return {
    assigned: toCount(source.assigned),
    en_route: toCount(source.en_route),
    arrived: toCount(source.arrived),
    resolved: toCount(source.resolved),
  };
}

type UseProfileRequestShortcutsOptions = {
  enabled: boolean;
  userId?: string;
};

export function useProfileRequestShortcuts(options: UseProfileRequestShortcutsOptions) {
  const { enabled, userId } = options;
  const [seenShortcutCounts, setSeenShortcutCounts] = useState<Record<ProfileRequestShortcutTab, number>>(
    DEFAULT_SEEN_SHORTCUT_COUNTS
  );
  const [seenCountsLoaded, setSeenCountsLoaded] = useState(false);
  const { counts, loading, error, refresh } = useMyRequestCounts({ enabled });

  const storageKey = useMemo(() => {
    if (!enabled || !userId) return null;
    return `${SHORTCUT_SEEN_STORAGE_PREFIX}.${userId}`;
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !storageKey) {
      setSeenShortcutCounts(DEFAULT_SEEN_SHORTCUT_COUNTS);
      setSeenCountsLoaded(true);
      return;
    }

    let alive = true;
    setSeenCountsLoaded(false);

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!alive) return;

        setSeenShortcutCounts(raw ? normalizeSeenShortcutCounts(JSON.parse(raw)) : DEFAULT_SEEN_SHORTCUT_COUNTS);
      } catch {
        if (!alive) return;
        setSeenShortcutCounts(DEFAULT_SEEN_SHORTCUT_COUNTS);
      } finally {
        if (alive) setSeenCountsLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !storageKey || !seenCountsLoaded) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(seenShortcutCounts));
  }, [enabled, seenCountsLoaded, seenShortcutCounts, storageKey]);

  const markShortcutSeen = useCallback(
    (tab: ProfileRequestShortcutTab) => {
      if (!enabled || loading) return;
      setSeenShortcutCounts((prev) => ({
        ...prev,
        [tab]: Math.max(prev[tab], counts[tab]),
      }));
    },
    [counts, enabled, loading]
  );

  const markAllShortcutsSeen = useCallback(() => {
    if (!enabled || loading) return;
    setSeenShortcutCounts({
      assigned: counts.assigned,
      en_route: counts.en_route,
      arrived: counts.arrived,
      resolved: counts.resolved,
    });
  }, [counts, enabled, loading]);

  const showDotFor = useCallback(
    (tab: ProfileRequestShortcutTab) =>
      enabled && seenCountsLoaded && !loading && counts[tab] > (seenShortcutCounts[tab] ?? 0),
    [counts, enabled, loading, seenCountsLoaded, seenShortcutCounts]
  );

  return {
    counts,
    loading,
    error,
    refresh,
    seenCountsLoaded,
    showDotFor,
    markShortcutSeen,
    markAllShortcutsSeen,
  };
}
