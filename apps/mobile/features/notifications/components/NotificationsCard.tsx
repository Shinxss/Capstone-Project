import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { NOTIFICATION_TYPE_ICON_ACCENT } from "../constants/notification.constants";
import type { MobileNotificationItem } from "../models/mobileNotification";

type NotificationsCardProps = {
  item: MobileNotificationItem;
  title: string;
  timeLabel: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  showChevron?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onPress: (item: MobileNotificationItem) => void;
  onLongPress?: (item: MobileNotificationItem) => void;
  onToggleSelect?: (item: MobileNotificationItem) => void;
};

export function NotificationsCard({
  item,
  title,
  timeLabel,
  iconName,
  showChevron,
  selectionMode,
  selected,
  onPress,
  onLongPress,
  onToggleSelect,
}: NotificationsCardProps) {
  const { isDark } = useTheme();
  const canNavigate = Boolean(showChevron) && !selectionMode;
  const checked = Boolean(selected);
  const iconAccent = NOTIFICATION_TYPE_ICON_ACCENT[item.type] ?? NOTIFICATION_TYPE_ICON_ACCENT.SYSTEM;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${item.isRead ? "Read" : "Unread"} notification${selectionMode ? checked ? ". Selected" : ". Not selected" : ""}`}
      delayLongPress={220}
      onLongPress={() => onLongPress?.(item)}
      onPress={() => {
        if (selectionMode) {
          onToggleSelect?.(item);
          return;
        }
        onPress(item);
      }}
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : null,
        item.isRead ? (isDark ? styles.cardReadDark : styles.cardRead) : null,
        !item.isRead ? (isDark ? styles.cardUnreadDark : styles.cardUnread) : null,
        checked ? (isDark ? styles.cardSelectedDark : styles.cardSelected) : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      {selectionMode ? (
        <View style={styles.checkWrap}>
          <Ionicons
            name={checked ? "checkbox-outline" : "square-outline"}
            size={20}
            color={isDark ? "#E2E8F0" : "#111827"}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isDark ? iconAccent.bgDark : iconAccent.bgLight,
          },
        ]}
      >
        <Ionicons name={iconName} size={21} color={isDark ? iconAccent.dark : iconAccent.light} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={[styles.title, isDark ? styles.titleDark : null]}>
            {title}
          </Text>
          <Text style={[styles.time, isDark ? styles.timeDark : null]}>{timeLabel}</Text>
        </View>

        <Text numberOfLines={2} style={[styles.body, isDark ? styles.bodyDark : null]}>
          {item.body}
        </Text>
      </View>

      {!item.isRead ? <View style={styles.unreadDot} /> : null}

      {canNavigate ? (
        <Ionicons
          name="chevron-forward"
          size={15}
          color={isDark ? "#94A3B8" : "#6B7280"}
          style={styles.chevron}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    minHeight: 84,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardDark: {
    borderColor: "#1E293B",
    backgroundColor: "#0B1220",
  },
  cardUnread: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  cardUnreadDark: {
    borderColor: "#7F1D1D",
    backgroundColor: "#1A0F16",
  },
  cardRead: {
    opacity: 0.92,
  },
  cardReadDark: {
    opacity: 0.86,
  },
  cardPressed: {
    opacity: 0.78,
  },
  cardSelected: {
    borderColor: "#DC2626",
  },
  cardSelectedDark: {
    borderColor: "#EF4444",
  },
  checkWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginRight: 10,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  titleDark: {
    color: "#F1F5F9",
  },
  time: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  timeDark: {
    color: "#94A3B8",
  },
  body: {
    marginTop: 3,
    minHeight: 36,
    fontSize: 13,
    lineHeight: 18,
    color: "#4B5563",
  },
  bodyDark: {
    color: "#CBD5E1",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    marginLeft: 8,
    marginTop: 7,
  },
  chevron: {
    marginLeft: 6,
    marginTop: 7,
  },
});
