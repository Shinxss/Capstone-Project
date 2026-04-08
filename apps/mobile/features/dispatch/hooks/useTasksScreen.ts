import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DispatchOffer } from "../models/dispatch";
import type { TasksTabKey, TasksTabItem } from "../models/dispatchTaskView";
import { DEFAULT_TASKS_TAB, TASKS_TAB_CONFIG } from "../constants/dispatchUi.constants";
import {
  fetchMyCompletedDispatches,
  fetchMyCurrentDispatch,
  fetchMyPendingDispatch,
} from "../services/dispatchApi";
import { usePullToRefresh } from "../../common/hooks/usePullToRefresh";
import { connectRealtime, getRealtimeSocket } from "../../realtime/socketClient";
import { useDispatchActions } from "./useDispatchActions";
import { getDefaultTasksTab, groupDispatchesForTasks, hasAnyDispatchTasks } from "../utils/dispatchTaskGroups";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import { useTaskFocusStats } from "./useTaskFocusStats";

type UseTasksScreenParams = {
  enabled: boolean;
  mode: string;
  token?: string | null;
};

type RefreshOptions = {
  showLoading?: boolean;
};

function includesSearch(value: unknown, query: string) {
  return String(value ?? "").toLowerCase().includes(query);
}

function matchesDispatchSearchQuery(dispatch: DispatchOffer, query: string) {
  if (!query) return true;
  return (
    includesSearch(dispatch.emergency?.emergencyType, query) ||
    includesSearch(dispatch.emergency?.barangayName, query) ||
    includesSearch(dispatch.emergency?.notes, query) ||
    includesSearch(getDispatchStatusLabel(dispatch), query)
  );
}

export function useTasksScreen(params: UseTasksScreenParams) {
  const { enabled, mode, token } = params;
  const [pendingDispatch, setPendingDispatch] = useState<DispatchOffer | null>(null);
  const [currentDispatch, setCurrentDispatch] = useState<DispatchOffer | null>(null);
  const [completedDispatches, setCompletedDispatches] = useState<DispatchOffer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TasksTabKey>(DEFAULT_TASKS_TAB);
  const autoSelectedInitialTabRef = useRef(false);
  const {
    stats: focusStats,
    loading: focusStatsLoading,
    refresh: refreshFocusStats,
  } = useTaskFocusStats({
    enabled,
    autoLoad: false,
  });

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      const showLoading = options?.showLoading ?? true;

      if (!enabled) {
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        const [pending, current, completed] = await Promise.all([
          fetchMyPendingDispatch(),
          fetchMyCurrentDispatch(),
          fetchMyCompletedDispatches(),
        ]);
        setPendingDispatch(pending);
        setCurrentDispatch(current);
        setCompletedDispatches(completed);
        await refreshFocusStats({ showLoading: false });
      } catch {
        // Keep existing state on network failures.
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [enabled, refreshFocusStats]
  );

  const refreshWithoutLoading = useCallback(async () => {
    await refresh({ showLoading: false });
  }, [refresh]);

  const { refreshing, triggerRefresh } = usePullToRefresh(refreshWithoutLoading);

  useEffect(() => {
    if (!enabled) {
      setPendingDispatch(null);
      setCurrentDispatch(null);
      setCompletedDispatches([]);
      setSearchQuery("");
      setLoading(false);
      setActiveTab(DEFAULT_TASKS_TAB);
      autoSelectedInitialTabRef.current = false;
      return;
    }

    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    if (mode !== "authed" || !token) return;

    const socket = getRealtimeSocket() ?? connectRealtime(token);
    if (!socket) return;

    const syncDispatches = () => {
      void refresh({ showLoading: false });
    };

    socket.on("notify:dispatch_offer", syncDispatches);
    socket.on("connect", syncDispatches);

    return () => {
      socket.off("notify:dispatch_offer", syncDispatches);
      socket.off("connect", syncDispatches);
    };
  }, [enabled, mode, refresh, token]);

  const groups = useMemo(
    () =>
      groupDispatchesForTasks({
        pendingDispatch,
        currentDispatch,
        completedDispatches,
      }),
    [completedDispatches, currentDispatch, pendingDispatch]
  );

  const tabs = useMemo<TasksTabItem[]>(
    () =>
      TASKS_TAB_CONFIG.map((tab) => ({
        key: tab.key,
        label: tab.label,
        count: groups[tab.key].length,
      })),
    [groups]
  );

  const activeTabConfig = useMemo(
    () => TASKS_TAB_CONFIG.find((tab) => tab.key === activeTab) ?? TASKS_TAB_CONFIG[0],
    [activeTab]
  );

  const visibleDispatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups[activeTab];
    return groups[activeTab].filter((dispatch) => matchesDispatchSearchQuery(dispatch, query));
  }, [activeTab, groups, searchQuery]);

  useEffect(() => {
    if (loading) return;
    if (autoSelectedInitialTabRef.current) return;

    setActiveTab(getDefaultTasksTab(groups));
    autoSelectedInitialTabRef.current = true;
  }, [groups, loading]);

  const actions = useDispatchActions({
    onAccepted: async (updated) => {
      setPendingDispatch(null);
      setCurrentDispatch(updated);
      await refresh({ showLoading: false });
    },
    onDeclined: async () => {
      setPendingDispatch(null);
      await refresh({ showLoading: false });
    },
    onCurrentUpdated: (updated) => {
      setCurrentDispatch(updated);
    },
    onPendingExpired: async () => {
      setPendingDispatch(null);
      await refresh({ showLoading: false });
    },
  });

  return {
    loading,
    refreshing,
    triggerRefresh,
    focusStats,
    focusStatsLoading,
    tabs,
    activeTab,
    setActiveTab,
    activeTabConfig,
    searchQuery,
    setSearchQuery,
    groups,
    visibleDispatches,
    hasAnyTask: hasAnyDispatchTasks(groups),
    actions,
  };
}
