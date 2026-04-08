import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { NOTIFICATION_FILTER_ITEMS } from "../constants/notification.constants";
import type { NotificationFilter } from "../models/mobileNotification";

type NotificationsTabsProps = {
  activeTab: NotificationFilter;
  onTabChange: (tab: NotificationFilter) => void;
  unreadByFilter?: Partial<Record<NotificationFilter, number>>;
};

export function NotificationsTabs({
  activeTab,
  onTabChange,
  unreadByFilter,
}: NotificationsTabsProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {NOTIFICATION_FILTER_ITEMS.map((tab) => {
          const isActive = activeTab === tab.key;
          const unread = Number(unreadByFilter?.[tab.key] ?? 0);

          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} notifications`}
              style={({ pressed }) => [
                styles.tabButton,
                isActive ? (isDark ? styles.tabButtonActiveDark : styles.tabButtonActive) : null,
                pressed ? styles.tabPressed : null,
              ]}
            >
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unread > 99 ? "99+" : unread}
                  </Text>
                </View>
              ) : null}

              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isDark ? styles.tabLabelDark : null,
                  isActive ? (isDark ? styles.tabLabelActiveDark : styles.tabLabelActive) : null,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    minHeight: 42,
  },
  tabsRow: { paddingHorizontal: 16, gap: 8 },
  tabButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    flexDirection: "row",
  },
  tabButtonActive: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
  },
  tabButtonActiveDark: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
  },
  tabPressed: {
    opacity: 0.84,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    textAlign: "center",
  },
  tabLabelDark: {
    color: "#CBD5E1",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  tabLabelActiveDark: {
    color: "#FFFFFF",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "800",
  },
});
