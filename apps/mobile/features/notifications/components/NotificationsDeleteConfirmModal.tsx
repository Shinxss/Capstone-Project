import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type NotificationsDeleteConfirmModalProps = {
  visible: boolean;
  count: number;
  onCancel: () => void;
  onConfirmDelete: () => void;
};

export function NotificationsDeleteConfirmModal({
  visible,
  count,
  onCancel,
  onConfirmDelete,
}: NotificationsDeleteConfirmModalProps) {
  const { isDark } = useTheme();
  const plural = count === 1 ? "" : "s";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlayWrap}>
        <Pressable style={styles.overlay} onPress={onCancel} />

        <View style={[styles.card, isDark ? styles.cardDark : null]}>
          <Text style={[styles.title, isDark ? styles.titleDark : null]}>Delete notification{plural}?</Text>
          <Text style={[styles.body, isDark ? styles.bodyDark : null]}>
            {count === 1
              ? "This notification will be removed from your list."
              : `${count} selected notifications will be removed from your list.`}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel delete"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                isDark ? styles.cancelButtonDark : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={[styles.cancelText, isDark ? styles.cancelTextDark : null]}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm delete"
              onPress={onConfirmDelete}
              style={({ pressed }) => [styles.deleteButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  cardDark: {
    borderColor: "#1E293B",
    backgroundColor: "#0B1220",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  titleDark: {
    color: "#F1F5F9",
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
  bodyDark: {
    color: "#CBD5E1",
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonDark: {
    borderColor: "#334155",
    backgroundColor: "#0E1626",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  cancelTextDark: {
    color: "#CBD5E1",
  },
  deleteButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
