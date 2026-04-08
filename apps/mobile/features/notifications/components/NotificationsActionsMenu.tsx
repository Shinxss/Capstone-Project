import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";

type NotificationsActionsMenuProps = {
  visible: boolean;
  canMarkAllRead: boolean;
  onClose: () => void;
  onPressMarkAllRead: () => void;
};

export function NotificationsActionsMenu({
  visible,
  canMarkAllRead,
  onClose,
  onPressMarkAllRead,
}: NotificationsActionsMenuProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlayWrap}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <View
          style={[
            styles.menuCard,
            isDark ? styles.menuCardDark : null,
            { top: insets.top + 54 },
          ]}
        >
          <Pressable
            disabled={!canMarkAllRead}
            onPress={onPressMarkAllRead}
            style={({ pressed }) => [
              styles.menuRow,
              !canMarkAllRead ? styles.menuRowDisabled : null,
              pressed && canMarkAllRead ? styles.menuRowPressed : null,
            ]}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={18}
              color={canMarkAllRead ? (isDark ? "#E2E8F0" : "#111827") : "#9CA3AF"}
              style={styles.menuIcon}
            />
            <Text
              style={[
                styles.menuText,
                isDark ? styles.menuTextDark : null,
                !canMarkAllRead ? styles.menuTextDisabled : null,
              ]}
            >
              Mark all read
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  menuCard: {
    position: "absolute",
    right: 12,
    width: 188,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: "hidden",
  },
  menuCardDark: {
    borderColor: "#1E293B",
    backgroundColor: "#111827",
  },
  menuRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  menuRowPressed: {
    opacity: 0.75,
  },
  menuRowDisabled: {
    opacity: 0.58,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  menuTextDark: {
    color: "#E2E8F0",
  },
  menuTextDisabled: {
    color: "#9CA3AF",
  },
});
