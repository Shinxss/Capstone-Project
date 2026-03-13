import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSession } from "../../auth/hooks/useSession";
import { usePullToRefresh } from "../../common/hooks/usePullToRefresh";
import { MyRequestsHeader, type MyRequestsHeaderTabOption } from "../components/MyRequestsHeader";
import { RequestHistoryCard } from "../components/RequestHistoryCard";
import { useMyRequestsHistory } from "../hooks/useMyRequestsHistory";
import { cancelMyRequest } from "../services/myRequestsApi";
import {
  MY_REQUEST_TAB_LABELS,
  normalizeMyRequestStatusTab,
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

const STATUS_TABS: MyRequestsHeaderTabOption<MyRequestStatusTab>[] = STATUS_TAB_ORDER.map((tab) => ({
  value: tab,
  label: MY_REQUEST_TAB_LABELS[tab],
}));

function actionLabelForStatus(): string {
  return "View Tracking Details";
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
  const [searchValue, setSearchValue] = useState("");
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
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
    (item: { id: string }) => {
      openTracking(item.id);
    },
    [openTracking]
  );

  const onPressCancel = useCallback(
    (item: MyRequestSummary) => {
      if (item.trackingLabel !== "Submitted") return;
      const requestId = String(item.id ?? "").trim();
      if (!requestId) return;

      Alert.alert(
        "Cancel request?",
        "This will mark your emergency request as cancelled.",
        [
          { text: "Keep request", style: "cancel" },
          {
            text: "Cancel request",
            style: "destructive",
            onPress: () => {
              void (async () => {
                setCancellingRequestId(requestId);
                try {
                  await cancelMyRequest(requestId);
                  await refreshHistory();
                  Alert.alert("Request cancelled", "Your emergency request has been cancelled.");
                } catch (e: any) {
                  const message =
                    e?.response?.data?.message ??
                    e?.message ??
                    "Unable to cancel this request right now.";
                  Alert.alert("Unable to cancel", String(message));
                } finally {
                  setCancellingRequestId((prev) => (prev === requestId ? null : prev));
                }
              })();
            },
          },
        ]
      );
    },
    [refreshHistory]
  );

  const filteredItems = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((item) => {
      const haystack = [
        item.referenceNumber,
        item.locationText,
        item.type,
        item.trackingLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, searchValue]);

  const onPressHeaderMenu = useCallback(() => {
    setSearchValue("");
    setActiveTab("all");
  }, []);

  if (sessionLoading || !isUser) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-zinc-100" edges={["left", "right"]}>
        <ActivityIndicator size="small" color="#DC2626" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["left", "right"]}>
      <MyRequestsHeader
        tabs={STATUS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder="Search your requests"
        onBackPress={() => router.back()}
        onMenuPress={onPressHeaderMenu}
      />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshing={refreshingHistory}
        onRefresh={triggerRefreshHistory}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 40,
          gap: 12,
          flexGrow: filteredItems.length === 0 ? 1 : 0,
        }}
        renderItem={({ item }) => (
          <RequestHistoryCard
            item={item}
            actionLabel={actionLabelForStatus()}
            onPress={() => onPressCard(item)}
            onPressAction={() => onPressAction(item)}
            cancelLabel={
              item.trackingLabel === "Submitted" || item.trackingLabel === "Assigned"
                ? cancellingRequestId === item.id
                  ? "Cancelling..."
                  : "Cancel Request"
                : null
            }
            onPressCancel={() => onPressCancel(item)}
            cancelDisabled={cancellingRequestId === item.id || item.trackingLabel !== "Submitted"}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View className="mt-8 items-center justify-center">
              <ActivityIndicator size="small" color="#DC2626" />
              <Text className="mt-2 text-sm text-zinc-500">Loading requests...</Text>
            </View>
          ) : searchValue.trim() ? (
            <View className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <Text className="text-center text-sm text-zinc-600">No requests match your search</Text>
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
