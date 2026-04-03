import { useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../../auth/AuthProvider";
import { useTasksAccess } from "../../auth/hooks/useTasksAccess";
import { RefreshableScrollScreen } from "../../common/components/RefreshableScrollScreen";
import type { DispatchOffer } from "../models/dispatch";
import { useTasksScreen } from "../hooks/useTasksScreen";
import { ActiveDispatchCard } from "../components/ActiveDispatchCard";
import { AwaitingApprovalCard } from "../components/AwaitingApprovalCard";
import { CompletedDispatchCard } from "../components/CompletedDispatchCard";
import { DailyFocusStatsCard } from "../components/DailyFocusStatsCard";
import { PendingDispatchCard } from "../components/PendingDispatchCard";
import { TaskSection } from "../components/TaskSection";
import { TaskSearchBar } from "../components/TaskSearchBar";
import { TasksTabs } from "../components/TasksTabs";

export function TasksScreen() {
  const router = useRouter();
  const { mode, token } = useAuth();
  const { hydrated, canAccessTasks } = useTasksAccess();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    if (!hydrated) return;
    if (canAccessTasks) return;
    router.replace("/(auth)/login");
  }, [canAccessTasks, hydrated, isFocused, router]);

  const tasks = useTasksScreen({
    enabled: hydrated && canAccessTasks,
    mode,
    token,
  });

  const renderDispatchCard = useCallback(
    (dispatch: DispatchOffer) => {
      if (tasks.activeTab === "new_dispatch") {
        return (
          <PendingDispatchCard
            dispatch={dispatch}
            busy={tasks.actions.isBusy}
            onAccept={tasks.actions.acceptDispatch}
            onDecline={tasks.actions.declineDispatch}
          />
        );
      }

      if (tasks.activeTab === "active") {
        return (
          <ActiveDispatchCard
            dispatch={dispatch}
            busy={tasks.actions.isBusy}
            uploadingProof={tasks.actions.isUploadingProof}
            markingDone={tasks.actions.isMarkingDone}
            onUploadProof={tasks.actions.uploadProof}
            onMarkDone={tasks.actions.markDispatchDone}
          />
        );
      }

      if (tasks.activeTab === "awaiting_approval") {
        return <AwaitingApprovalCard dispatch={dispatch} />;
      }

      return <CompletedDispatchCard dispatch={dispatch} />;
    },
    [
      tasks.activeTab,
      tasks.actions.acceptDispatch,
      tasks.actions.declineDispatch,
      tasks.actions.isBusy,
      tasks.actions.isMarkingDone,
      tasks.actions.isUploadingProof,
      tasks.actions.markDispatchDone,
      tasks.actions.uploadProof,
    ]
  );

  if (!hydrated || !canAccessTasks) return null;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
        <View style={styles.topContent}>
          <View style={styles.searchSection}>
          <TaskSearchBar value={tasks.searchQuery} onChangeText={tasks.setSearchQuery} />
          </View>
          <View style={styles.focusSection}>
            <DailyFocusStatsCard stats={tasks.focusStats} />
          </View>
        </View>
      </SafeAreaView>

      <TasksTabs tabs={tasks.tabs} activeTab={tasks.activeTab} onChange={tasks.setActiveTab} />

      <RefreshableScrollScreen
        refreshing={tasks.refreshing}
        onRefresh={tasks.triggerRefresh}
        refreshControlProps={{ progressViewOffset: 110 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
      >
        <TaskSection
          loading={tasks.loading}
          items={tasks.visibleDispatches}
          emptyTitle={tasks.activeTabConfig.emptyTitle}
          emptyMessage={tasks.activeTabConfig.emptyDescription}
          renderItem={renderDispatchCard}
        />
      </RefreshableScrollScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  topSafeArea: {
    backgroundColor: "#FFFFFF",
  },
  topContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchSection: {
    paddingTop: 8,
  },
  focusSection: {
    marginTop: 12,
  },
});
