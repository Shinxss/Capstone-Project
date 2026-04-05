import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";

type NotificationTab = "ALL" | "UPDATES" | "ALERT" | "ANNOUNCEMENT";

const NOTIFICATION_TABS: Array<{ key: NotificationTab; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "UPDATES", label: "Updates" },
  { key: "ALERT", label: "Alert" },
  { key: "ANNOUNCEMENT", label: "Announcement" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<NotificationTab>("ALL");

  const emptyState = useMemo(() => {
    if (activeTab === "UPDATES") {
      return {
        title: "No updates yet",
        body: "Updates about your activity will appear here.",
      };
    }

    if (activeTab === "ALERT") {
      return {
        title: "No alerts yet",
        body: "Emergency and high-priority alerts will appear here.",
      };
    }

    if (activeTab === "ANNOUNCEMENT") {
      return {
        title: "No announcements yet",
        body: "Announcements from Lifeline and your LGU will appear here.",
      };
    }

    return {
      title: "No notifications yet",
      body: "You are all caught up. New alerts and updates will appear here.",
    };
  }, [activeTab]);

  return (
    <SafeAreaView style={[styles.safe, isDark ? styles.safeDark : styles.safeLight]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            isDark ? styles.backButtonDark : null,
            pressed ? styles.backButtonPressed : null,
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={isDark ? "#E2E8F0" : "#0F172A"} />
          <Text style={[styles.backLabel, isDark ? styles.backLabelDark : null]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, isDark ? styles.titleDark : null]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsRow}>
        {NOTIFICATION_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [
                styles.tabPill,
                isDark ? styles.tabPillDark : null,
                isActive ? (isDark ? styles.tabPillActiveDark : styles.tabPillActive) : null,
                pressed ? styles.tabPillPressed : null,
              ]}
            >
              <Text
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
      </View>

      <View style={styles.content}>
        <View style={[styles.emptyCard, isDark ? styles.emptyCardDark : null]}>
          <View style={[styles.iconWrap, isDark ? styles.iconWrapDark : null]}>
            <Ionicons name="notifications-outline" size={34} color={isDark ? "#CBD5E1" : "#6B7280"} />
          </View>
          <Text style={[styles.emptyTitle, isDark ? styles.emptyTitleDark : null]}>{emptyState.title}</Text>
          <Text style={[styles.emptyBody, isDark ? styles.emptyBodyDark : null]}>{emptyState.body}</Text>
        </View>
      </View>
    </SafeAreaView>
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
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonDark: {
    borderColor: "#162544",
    backgroundColor: "#0E1626",
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  backLabel: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  backLabelDark: {
    color: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  titleDark: {
    color: "#F1F5F9",
  },
  headerSpacer: {
    width: 64,
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  tabPill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tabPillDark: {
    borderColor: "#162544",
    backgroundColor: "#0E1626",
  },
  tabPillActive: {
    borderColor: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  tabPillActiveDark: {
    borderColor: "#3B82F6",
    backgroundColor: "#1E3A8A",
  },
  tabPillPressed: {
    opacity: 0.86,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  tabLabelDark: {
    color: "#CBD5E1",
  },
  tabLabelActive: {
    color: "#B91C1C",
  },
  tabLabelActiveDark: {
    color: "#DBEAFE",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  emptyCardDark: {
    borderColor: "#162544",
    backgroundColor: "#0B1220",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  iconWrapDark: {
    backgroundColor: "#1B2A45",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  emptyTitleDark: {
    color: "#F1F5F9",
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyBodyDark: {
    color: "#94A3B8",
  },
});
