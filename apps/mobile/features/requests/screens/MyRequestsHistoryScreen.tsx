import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../auth/hooks/useSession";
import { usePullToRefresh } from "../../common/hooks/usePullToRefresh";
import { MyRequestsHeader, type MyRequestsHeaderTabOption } from "../components/MyRequestsHeader";
import { MyRequestsFilterSheet } from "../components/MyRequestsFilterSheet";
import { RequestHistoryCard } from "../components/RequestHistoryCard";
import { RequestsListSkeleton } from "../components/RequestsSkeletons";
import { useMyRequestsHistory } from "../hooks/useMyRequestsHistory";
import { cancelMyRequest } from "../services/myRequestsApi";
import { filterAndSortMyRequests } from "../utils/requestsFilter";
import {
  MY_REQUEST_TAB_LABELS,
  normalizeMyRequestStatusTab,
  type MyRequestStatusTab,
  type MyRequestSummary,
  type RequestSortOrder,
  type RequestTypeFilter,
} from "../models/myRequests";

const STATUS_TAB_ORDER: MyRequestStatusTab[] = [
  "all",
  "submitted",
  "verification",
  "assigned",
  "en_route",
  "arrived",
  "review",
  "resolved",
  "cancelled",
];

const STATUS_TABS: MyRequestsHeaderTabOption<MyRequestStatusTab>[] = STATUS_TAB_ORDER.map((tab) => ({
  value: tab,
  label: MY_REQUEST_TAB_LABELS[tab],
}));

function actionLabelForStatus(tab: MyRequestStatusTab, item: MyRequestSummary): string {
  if (tab === "review" || item.trackingLabel === "Review") return "Leave Review";
  if (tab === "resolved" || item.trackingLabel === "Resolved") return "View Review";
  return "View Tracking Details";
}

function emptyMessageForTab(tab: MyRequestStatusTab) {
  if (tab === "all") return "No Request submitted";
  if (tab === "submitted") return "No Request submitted";
  if (tab === "verification") return "No Request for verification";
  if (tab === "assigned") return "No Request assigned";
  if (tab === "en_route") return "No Request en route";
  if (tab === "arrived") return "No Request arrived";
  if (tab === "review") return "No Request for review";
  if (tab === "resolved") return "No Request resolved";
  return "No Request cancelled";
}

export function MyRequestsHistoryScreen() {
  const params = useLocalSearchParams<{ tab?: string | string[]; refreshTs?: string | string[] }>();
  const { isUser, loading: sessionLoading } = useSession();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const refreshParam = Array.isArray(params.refreshTs) ? params.refreshTs[0] : params.refreshTs;
  const initialTab = useMemo(
    () => normalizeMyRequestStatusTab(tabParam, "all"),
    [tabParam]
  );
  const [activeTab, setActiveTab] = useState<MyRequestStatusTab>(initialTab);
  const [searchValue, setSearchValue] = useState("");
  const [sortOrder, setSortOrder] = useState<RequestSortOrder>("newest");
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

  const hasActiveFilters = sortOrder !== "newest" || typeFilter !== "all";

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
    if (!isUser || !refreshParam) return;
    void refreshHistory();
  }, [isUser, refreshHistory, refreshParam]);

  useEffect(() => {
    if (!isFocused) return;
    if (sessionLoading) return;
    if (!isUser) {
      router.replace("/(auth)/login");
    }
  }, [isFocused, isUser, sessionLoading]);

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

  const openReview = useCallback((requestId: string) => {
    router.push({
      pathname: "/my-requests/review",
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
      if (item.trackingLabel === "Review" || item.trackingLabel === "Resolved") {
        openReview(item.id);
        return;
      }
      openTracking(item.id);
    },
    [openReview, openTracking]
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
    return filterAndSortMyRequests(items, {
      searchValue,
      typeFilter,
      sortOrder,
    });
  }, [items, searchValue, typeFilter, sortOrder]);

  const onPressHeaderMenu = useCallback(() => {
    setIsFilterSheetOpen(true);
  }, []);

  const onApplyFilters = useCallback(
    (filters: { sortOrder: RequestSortOrder; typeFilter: RequestTypeFilter }) => {
      setSortOrder(filters.sortOrder);
      setTypeFilter(filters.typeFilter);
    },
    []
  );

  const onResetFilters = useCallback(() => {
    setSortOrder("newest");
    setTypeFilter("all");
  }, []);

  const emptyTabMessage = useMemo(() => emptyMessageForTab(activeTab), [activeTab]);

  if (sessionLoading || !isUser) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F4F5" }}
        edges={["left", "right"]}
      >
        <ActivityIndicator size="small" color="#DC2626" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["left", "right"]}>
      <MyRequestsHeader
        tabs={STATUS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder="Search your requests"
        onBackPress={() => router.back()}
        onMenuPress={onPressHeaderMenu}
        hasActiveFilters={hasActiveFilters}
      />

      <FlatList
        style={{ flex: 1 }}
        data={filteredItems}
        keyExtractor={(item, index) =>
          String(item.id ?? "").trim() || `${item.referenceNumber}-${item.createdAt}-${index}`
        }
        refreshing={refreshingHistory}
        onRefresh={triggerRefreshHistory}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: Math.max(32, insets.bottom + 24),
          gap: 12,
          flexGrow: filteredItems.length === 0 ? 1 : 0,
        }}
        renderItem={({ item }) => (
          <RequestHistoryCard
            item={item}
            actionLabel={actionLabelForStatus(activeTab, item)}
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
            <RequestsListSkeleton label="Loading request history" />
          ) : items.length > 0 ? (
            <View className="mt-6 rounded-2xl bg-white p-6">
              <Text className="text-center text-sm text-zinc-600">
                {searchValue.trim() && typeFilter !== "all"
                  ? "No requests match your search and filters."
                  : searchValue.trim()
                  ? "No requests match your search"
                  : "No requests match your filters."}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View className="items-center rounded-2xl bg-white p-10">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
                  <Ionicons name="document-text-outline" size={34} color="#71717A" />
                </View>
                <Text className="mt-3 text-center text-sm font-semibold text-zinc-700">
                  {emptyTabMessage}
                </Text>
              </View>
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

      <MyRequestsFilterSheet
        visible={isFilterSheetOpen}
        sortOrder={sortOrder}
        typeFilter={typeFilter}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        onClose={() => setIsFilterSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
