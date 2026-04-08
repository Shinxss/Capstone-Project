import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";

type NotificationsHeaderProps = {
  onPressBack: () => void;
  unreadCount: number;
  onPressMenu?: () => void;
  selectionMode?: boolean;
  selectedCount?: number;
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
  onCancelSelection?: () => void;
};

export function NotificationsHeader({
  onPressBack,
  unreadCount,
  onPressMenu,
  selectionMode,
  selectedCount = 0,
  allSelected = false,
  onToggleSelectAll,
  onCancelSelection,
}: NotificationsHeaderProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : null,
        { paddingTop: insets.top + 2 },
      ]}
    >
      {selectionMode ? (
        <>
          <Pressable
            onPress={onToggleSelectAll}
            accessibilityRole="button"
            accessibilityLabel={allSelected ? "Unselect all notifications" : "Select all notifications"}
            hitSlop={8}
            style={({ pressed }) => [styles.selectAllButton, pressed ? styles.pressed : null]}
          >
            <Ionicons
              name={allSelected ? "checkbox-outline" : "square-outline"}
              size={20}
              color={isDark ? "#E2E8F0" : "#111827"}
            />
            <Text style={[styles.selectAllLabel, isDark ? styles.selectAllLabelDark : null]}>
              Select all
            </Text>
          </Pressable>

          <View style={styles.selectionTitleWrap}>
            <Text style={[styles.selectionTitle, isDark ? styles.selectionTitleDark : null]}>
              {selectedCount} selected
            </Text>
          </View>

          <Pressable
            onPress={onCancelSelection}
            accessibilityRole="button"
            accessibilityLabel="Cancel delete mode"
            hitSlop={8}
            style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? "#E2E8F0" : "#111827"}
            />
          </Pressable>
        </>
      ) : (
        <>
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="arrow-back" size={21} color={isDark ? "#E2E8F0" : "#111827"} />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={[styles.title, isDark ? styles.titleDark : null]}>Notifications</Text>
            <View
              accessibilityRole="text"
              accessibilityLabel={`${unreadCount} unread notifications`}
              style={[styles.unreadBadge, isDark ? styles.unreadBadgeDark : null]}
            >
              <Text style={styles.unreadBadgeText}>
                {unreadCount} unread
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onPressMenu}
            accessibilityRole="button"
            accessibilityLabel="Notification actions"
            hitSlop={8}
            style={({ pressed }) => [
              styles.menuButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={isDark ? "#E2E8F0" : "#111827"}
            />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  containerDark: {
    borderBottomColor: "#162544",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  pressed: {
    opacity: 0.74,
  },
  titleWrap: {
    flex: 1,
    justifyContent: "center",
  },
  selectionTitleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
  },
  titleDark: {
    color: "#F1F5F9",
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  selectionTitleDark: {
    color: "#F1F5F9",
  },
  selectAllButton: {
    minWidth: 120,
    height: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
  },
  selectAllLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  selectAllLabelDark: {
    color: "#E2E8F0",
  },
  unreadBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  unreadBadgeDark: {
    borderColor: "#7F1D1D",
    backgroundColor: "#3B1C28",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B91C1C",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
