import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type NotificationsEmptyStateProps = {
  title: string;
  body: string;
};

export function NotificationsEmptyState({ title, body }: NotificationsEmptyStateProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, isDark ? styles.iconWrapDark : null]}>
        <Ionicons name="notifications-off-outline" size={28} color={isDark ? "#CBD5E1" : "#6B7280"} />
      </View>
      <Text style={[styles.title, isDark ? styles.titleDark : null]}>{title}</Text>
      <Text style={[styles.body, isDark ? styles.bodyDark : null]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  iconWrapDark: {
    backgroundColor: "#1B2A45",
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  titleDark: {
    color: "#F1F5F9",
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  bodyDark: {
    color: "#94A3B8",
  },
});
