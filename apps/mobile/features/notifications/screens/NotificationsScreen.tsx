import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationFilterTabs } from "../components/NotificationFilterTabs";
import { NotificationSearchBar } from "../components/NotificationSearchBar";
import { NotificationSectionList } from "../components/NotificationSectionList";
import { NotificationsActionsMenu } from "../components/NotificationsActionsMenu";
import { NotificationsDeleteConfirmModal } from "../components/NotificationsDeleteConfirmModal";
import { NotificationsDetailModal } from "../components/NotificationsDetailModal";
import { NotificationsEmptyState } from "../components/NotificationsEmptyState";
import { NotificationsHeader } from "../components/NotificationsHeader";
import { NotificationsListSkeleton } from "../components/NotificationsListSkeleton";
import { useNotificationsScreenModel } from "../hooks/useNotificationsScreenModel";
import type { MobileNotificationItem } from "../models/mobileNotification";
import { useTheme } from "../../theme/useTheme";

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useNotificationsScreenModel();

  const [detailItem, setDetailItem] = useState<MobileNotificationItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const openSwipeableIdRef = useRef<string | null>(null);

  const detailTitle = detailItem ? vm.titleForItem(detailItem) : "";
  const detailTime = detailItem ? vm.formatItemTime(detailItem.createdAt) : "";
  const visibleIds = useMemo(() => vm.filtered.map((item) => item.id), [vm.filtered]);
  const allSelected = useMemo(
    () => visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id)),
    [selectedIds, visibleIds]
  );
  const selectedCount = selectedIds.length;

  useEffect(() => {
    const existingSet = new Set(vm.items.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => existingSet.has(id)));
  }, [vm.items]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectionMode(false);
    }
  }, [selectedIds.length]);

  const closeActiveSwipeable = useCallback((exceptId?: string) => {
    const openId = openSwipeableIdRef.current;
    if (!openId) return;
    if (exceptId && openId === exceptId) return;
    swipeableRefs.current[openId]?.close();
    openSwipeableIdRef.current = null;
  }, []);

  const bindSwipeableRef = useCallback((id: string, ref: Swipeable | null) => {
    swipeableRefs.current[id] = ref;
    if (!ref && openSwipeableIdRef.current === id) {
      openSwipeableIdRef.current = null;
    }
  }, []);

  const onOpenCard = async (item: MobileNotificationItem) => {
    closeActiveSwipeable();

    if (selectionMode) {
      setSelectedIds((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
      );
      return;
    }

    try {
      const result = await vm.openNotification(item);
      if (result.kind === "navigate") {
        router.push({
          pathname: result.target.pathname as never,
          params: result.target.params as never,
        });
        return;
      }

      setDetailItem(result.item);
      setDetailVisible(true);
    } catch {
      // Keep UI responsive even if mark-read fails.
      setDetailItem(item);
      setDetailVisible(true);
    }
  };

  const onMarkAllRead = async () => {
    try {
      await vm.markAllRead();
    } catch {
      // Ignore hard-fail here and keep optimistic result.
    }
  };

  const openDeleteConfirm = (ids: string[]) => {
    const next = Array.from(new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean)));
    if (next.length === 0) return;
    setPendingDeleteIds(next);
    setDeleteConfirmVisible(true);
  };

  const onConfirmDelete = async () => {
    const ids = [...pendingDeleteIds];
    setDeleteConfirmVisible(false);
    setPendingDeleteIds([]);

    if (ids.length === 0) return;

    try {
      if (ids.length === 1) {
        await vm.deleteOne(ids[0]);
      } else {
        await vm.deleteMany(ids);
      }
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } catch {
      // Keep screen stable even if deletion fails.
    }
  };

  const onLongPressCard = (item: MobileNotificationItem) => {
    closeActiveSwipeable();
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
  };

  const onToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(visibleIds);
  };

  const onCancelSelection = () => {
    closeActiveSwipeable();
    setSelectionMode(false);
    setSelectedIds([]);
  };

  return (
    <View style={[styles.safe, isDark ? styles.safeDark : styles.safeLight]}>
      <NotificationsHeader
        onPressBack={() => router.back()}
        onPressMenu={selectionMode ? undefined : () => vm.setActionsVisible(true)}
        unreadCount={vm.unreadCount}
        selectionMode={selectionMode}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onToggleSelectAll={onToggleSelectAll}
        onCancelSelection={onCancelSelection}
      />

      <NotificationSearchBar
        value={vm.searchValue}
        onChangeText={vm.setSearchValue}
      />

      <NotificationFilterTabs
        visible={!selectionMode}
        activeTab={vm.filterTab}
        onTabChange={vm.setFilterTab}
        unreadByFilter={vm.unreadByFilter}
        unreadCount={vm.unreadCount}
        onPressMarkAllRead={onMarkAllRead}
      />

      {vm.error ? (
        <View style={[styles.errorBanner, isDark ? styles.errorBannerDark : null]}>
          <Text style={[styles.errorText, isDark ? styles.errorTextDark : null]}>
            Could not sync notifications.
          </Text>
          <Pressable
            onPress={() => {
              void vm.retry();
            }}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : null]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {vm.loading ? (
        <NotificationsListSkeleton />
      ) : vm.sections.length === 0 ? (
        <NotificationsEmptyState
          title={vm.emptyState.title}
          body={vm.emptyState.body}
        />
      ) : (
        <NotificationSectionList
          sections={vm.sections}
          isDark={isDark}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          refreshing={vm.refreshing}
          onRefresh={() => {
            void vm.onRefresh();
          }}
          onScrollBeginDrag={() => closeActiveSwipeable()}
          onOpenItem={(item) => {
            void onOpenCard(item);
          }}
          onLongPressItem={onLongPressCard}
          onToggleSelectItem={(item) => {
            setSelectedIds((prev) =>
              prev.includes(item.id)
                ? prev.filter((id) => id !== item.id)
                : [...prev, item.id]
            );
          }}
          onDeleteItem={(item) => {
            closeActiveSwipeable();
            openDeleteConfirm([item.id]);
          }}
          bindSwipeableRef={bindSwipeableRef}
          onSwipeableWillOpen={(id) => {
            closeActiveSwipeable(id);
            openSwipeableIdRef.current = id;
          }}
          onSwipeableClose={(id) => {
            if (openSwipeableIdRef.current === id) {
              openSwipeableIdRef.current = null;
            }
          }}
          titleForItem={vm.titleForItem}
          iconForItem={vm.iconForItem}
          formatItemTime={vm.formatItemTime}
          canNavigate={vm.canNavigate}
        />
      )}

      {selectionMode ? (
        <View
          style={[
            styles.selectionDeleteBar,
            isDark ? styles.selectionDeleteBarDark : null,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete selected notifications"
            disabled={selectedCount === 0}
            onPress={() => openDeleteConfirm(selectedIds)}
            style={({ pressed }) => [
              styles.selectionDeleteButton,
              selectedCount === 0 ? styles.selectionDeleteButtonDisabled : null,
              pressed && selectedCount > 0 ? styles.selectionDeletePressed : null,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <Text style={styles.selectionDeleteText}>
              Delete {selectedCount > 0 ? `(${selectedCount})` : ""}
            </Text>
          </Pressable>
        </View>
      ) : (
        <NotificationsActionsMenu
          visible={vm.actionsVisible}
          canMarkAllRead={vm.unreadCount > 0}
          onClose={() => vm.setActionsVisible(false)}
          onPressMarkAllRead={() => {
            void onMarkAllRead();
            vm.setActionsVisible(false);
          }}
        />
      )}

      <NotificationsDetailModal
        visible={detailVisible}
        item={detailItem}
        title={detailTitle}
        timeLabel={detailTime}
        onClose={() => {
          setDetailVisible(false);
          setDetailItem(null);
        }}
      />

      <NotificationsDeleteConfirmModal
        visible={deleteConfirmVisible}
        count={pendingDeleteIds.length}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setPendingDeleteIds([]);
        }}
        onConfirmDelete={() => {
          void onConfirmDelete();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  safeLight: {
    backgroundColor: "#F3F4F6",
  },
  safeDark: {
    backgroundColor: "#060C18",
  },
  errorBanner: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorBannerDark: {
    borderColor: "#7F1D1D",
    backgroundColor: "#3B1C28",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "700",
  },
  errorTextDark: {
    color: "#FCA5A5",
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryButtonPressed: {
    opacity: 0.74,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },
  selectionDeleteBar: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  selectionDeleteBarDark: {
    borderTopColor: "#1E293B",
    backgroundColor: "#0B1220",
  },
  selectionDeleteButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  selectionDeleteButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  selectionDeletePressed: {
    opacity: 0.82,
  },
  selectionDeleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
