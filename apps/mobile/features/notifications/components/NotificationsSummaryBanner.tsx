import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type NotificationsSummaryBannerProps = {
  unreadCount: number;
  onPressMarkAllRead: () => void;
  disabled?: boolean;
};

export function NotificationsSummaryBanner({
  unreadCount,
  onPressMarkAllRead,
  disabled,
}: NotificationsSummaryBannerProps) {
  const { isDark } = useTheme();
  const plural = unreadCount === 1 ? "" : "s";

  return (
    <View style={[styles.wrap, isDark ? styles.wrapDark : null]}>
      <Text style={[styles.copy, isDark ? styles.copyDark : null]}>
        You have {unreadCount} unread notification{plural}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mark all notifications as read"
        disabled={disabled}
        onPress={onPressMarkAllRead}
        style={({ pressed }) => [
          styles.action,
          disabled ? styles.actionDisabled : null,
          pressed && !disabled ? styles.actionPressed : null,
        ]}
      >
        <Text style={[styles.actionText, isDark ? styles.actionTextDark : null]}>
          Mark all as read
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    marginHorizontal: 16,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  wrapDark: {
    borderColor: "#1E293B",
    backgroundColor: "#0B1220",
  },
  copy: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  copyDark: {
    color: "#CBD5E1",
  },
  action: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },
  actionTextDark: {
    color: "#F87171",
  },
});
