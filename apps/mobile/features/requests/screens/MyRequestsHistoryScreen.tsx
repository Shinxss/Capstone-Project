import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../auth/hooks/useSession";
import { usePullToRefresh } from "../../common/hooks/usePullToRefresh";
import { RequestHistoryCard } from "../components/RequestHistoryCard";
import { RequestStatusTabs, type RequestStatusTabOption } from "../components/RequestStatusTabs";
import { useMyRequestsHistory } from "../hooks/useMyRequestsHistory";
import {
  MY_REQUEST_TAB_LABELS,
  normalizeMyRequestStatusTab,
  toMyRequestStatusTabFromLabel,
  type MyRequestStatusTab,
  type MyRequestSummary,
} from "../models/myRequests";

const STATUS_TAB_ORDER: MyRequestStatusTab[] = [
  "all",
  "submitted",
  "verification",
  "assigned",
  "en_route",
  "arrived",
  "resolved",
  "review",
  "cancelled",
];

const STATUS_TABS: RequestStatusTabOption[] = STATUS_TAB_ORDER.map((tab) => ({
  value: tab,
  label: MY_REQUEST_TAB_LABELS[tab],
}));

function actionLabelForStatus(item: MyRequestSummary): string | null {
  const tab = toMyRequestStatusTabFromLabel(item.trackingLabel);
  if (tab === "assigned" || tab === "en_route" || tab === "arrived") return "Track";
  if (tab === "review") return "Rate";
  if (tab === "resolved" || tab === "cancelled") return "View Details";
  return null;
}

export function MyRequestsHistoryScreen() {
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const { isUser, loading: sessionLoading } = useSession();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = useMemo(
    () => normalizeMyRequestStatusTab(tabParam, "all"),
    [tabParam]
  );
  const [activeTab, setActiveTab] = useState<MyRequestStatusTab>(initialTab);
  const { items, loading, error, refresh } = useMyRequestsHistory(activeTab, { enabled: isUser });
  const refreshHistory = useCallback(async () => {
    await refresh();
  }, [refresh]);
  const { refreshing: refreshingHistory, triggerRefresh: triggerRefreshHistory } =
    usePullToRefresh(refreshHistory);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isUser) {
      router.replace("/(auth)/login");
    }
  }, [isUser, sessionLoading]);

  useFocusEffect(
    useCallback(() => {
      if (!isUser) return;
      void refreshHistory();
    }, [isUser, refreshHistory])
  );

  const openTracking = useCallback((requestId: string) => {
    router.push({
      pathname: "/my-request-tracking",
      params: { id: requestId },
    });
  }, []);

  const onPressCard = useCallback(
    (item: MyRequestSummary) => {
      openTracking(item.id);
    },
    [openTracking]
  );

  const onPressAction = useCallback(
    (item: MyRequestSummary) => {
      const action = actionLabelForStatus(item);
      if (action === "Rate") {
        Alert.alert("Rate Request", "Rating flow will be available soon.");
        return;
      }

      openTracking(item.id);
    },
    [openTracking]
  );

  if (sessionLoading || !isUser) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-zinc-100">
        <ActivityIndicator size="small" color="#DC2626" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-100" edges={["top", "left", "right"]}>
      <View className="border-b border-zinc-200 bg-white px-4 pb-3 pt-2">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100"
          >
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </Pressable>
          <Text className="ml-3 text-2xl font-extrabold text-zinc-900">My Requests</Text>
        </View>
      </View>

      <RequestStatusTabs tabs={STATUS_TABS} activeTab={activeTab} onChange={setActiveTab} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={refreshingHistory}
        onRefresh={triggerRefreshHistory}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 40,
          gap: 12,
          flexGrow: items.length === 0 ? 1 : 0,
        }}
        renderItem={({ item }) => (
          <RequestHistoryCard
            item={item}
            actionLabel={actionLabelForStatus(item)}
            onPress={() => onPressCard(item)}
            onPressAction={() => onPressAction(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View className="mt-8 items-center justify-center">
              <ActivityIndicator size="small" color="#DC2626" />
              <Text className="mt-2 text-sm text-zinc-500">Loading requests...</Text>
            </View>
          ) : (
            <View className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <Text className="text-center text-sm text-zinc-600">No requests in this category</Text>
            </View>
          )
        }
        ListFooterComponent={
          error ? (
            <View className="mt-3 items-center">
              <Text className="text-xs text-red-600">{error}</Text>
              <Pressable
                className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2"
                onPress={() => {
                  void refreshHistory();
                }}
              >
                <Text className="text-xs font-extrabold text-red-600">Retry</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
