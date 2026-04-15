import React, { useMemo } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { NotificationsCard } from "./NotificationsCard";
import type { MobileNotificationItem } from "../models/mobileNotification";
import type { NotificationSection } from "../utils/notificationPresentation";

type NotificationSectionListProps = {
  sections: NotificationSection[];
  isDark: boolean;
  selectionMode: boolean;
  selectedIds: string[];
  refreshing: boolean;
  onRefresh: () => void;
  onScrollBeginDrag: () => void;
  onOpenItem: (item: MobileNotificationItem) => void;
  onLongPressItem: (item: MobileNotificationItem) => void;
  onToggleSelectItem: (item: MobileNotificationItem) => void;
  onDeleteItem: (item: MobileNotificationItem) => void;
  bindSwipeableRef: (id: string, ref: Swipeable | null) => void;
  onSwipeableWillOpen: (id: string) => void;
  onSwipeableClose: (id: string) => void;
  titleForItem: (item: MobileNotificationItem) => string;
  iconForItem: (item: MobileNotificationItem) => string;
  formatItemTime: (createdAt: string) => string;
  canNavigate: (item: MobileNotificationItem) => boolean;
};

export function NotificationSectionList({
  sections,
  isDark,
  selectionMode,
  selectedIds,
  refreshing,
  onRefresh,
  onScrollBeginDrag,
  onOpenItem,
  onLongPressItem,
  onToggleSelectItem,
  onDeleteItem,
  bindSwipeableRef,
  onSwipeableWillOpen,
  onSwipeableClose,
  titleForItem,
  iconForItem,
  formatItemTime,
  canNavigate,
}: NotificationSectionListProps) {
  const sectionData = useMemo(
    () => sections.map((section) => ({ ...section, data: section.items })),
    [sections]
  );

  return (
    <SectionList
      sections={sectionData}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onScrollBeginDrag={onScrollBeginDrag}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, isDark ? styles.sectionLabelDark : null]}>
            {section.label}
          </Text>
          <View style={[styles.sectionDivider, isDark ? styles.sectionDividerDark : null]} />
        </View>
      )}
      renderItem={({ item }) => (
        selectionMode ? (
          <NotificationsCard
            item={item}
            title={titleForItem(item)}
            iconName={iconForItem(item) as React.ComponentProps<typeof Ionicons>["name"]}
            timeLabel={formatItemTime(item.createdAt)}
            showChevron={false}
            selectionMode
            selected={selectedIds.includes(item.id)}
            onLongPress={onLongPressItem}
            onToggleSelect={onToggleSelectItem}
            onPress={(nextItem) => {
              onOpenItem(nextItem);
            }}
          />
        ) : (
          <Swipeable
            ref={(ref) => bindSwipeableRef(item.id, ref)}
            overshootRight={false}
            onSwipeableWillOpen={() => {
              onSwipeableWillOpen(item.id);
            }}
            onSwipeableClose={() => {
              onSwipeableClose(item.id);
            }}
            renderRightActions={() => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${titleForItem(item)} notification`}
                onPress={() => onDeleteItem(item)}
                style={({ pressed }) => [
                  styles.swipeDeleteAction,
                  isDark ? styles.swipeDeleteActionDark : null,
                  pressed ? styles.swipeDeleteActionPressed : null,
                ]}
              >
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={styles.swipeDeleteText}>Delete</Text>
              </Pressable>
            )}
          >
            <NotificationsCard
              item={item}
              title={titleForItem(item)}
              iconName={iconForItem(item) as React.ComponentProps<typeof Ionicons>["name"]}
              timeLabel={formatItemTime(item.createdAt)}
              showChevron={canNavigate(item)}
              onLongPress={onLongPressItem}
              onPress={(nextItem) => {
                onOpenItem(nextItem);
              }}
            />
          </Swipeable>
        )
      )}
      ItemSeparatorComponent={() => <View style={styles.itemGap} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 26,
  },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  sectionLabelDark: {
    color: "#94A3B8",
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    marginLeft: 8,
    backgroundColor: "#D1D5DB",
  },
  sectionDividerDark: {
    backgroundColor: "#334155",
  },
  itemGap: {
    height: 10,
  },
  swipeDeleteAction: {
    width: 90,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 8,
  },
  swipeDeleteActionDark: {
    backgroundColor: "#B91C1C",
  },
  swipeDeleteActionPressed: {
    opacity: 0.78,
  },
  swipeDeleteText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
