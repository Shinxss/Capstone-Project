import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { MobileNotificationItem } from "../models/mobileNotification";

type NotificationsDetailModalProps = {
  visible: boolean;
  item: MobileNotificationItem | null;
  title: string;
  timeLabel: string;
  onClose: () => void;
};

export function NotificationsDetailModal({
  visible,
  item,
  title,
  timeLabel,
  onClose,
}: NotificationsDetailModalProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayWrap}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={[styles.card, isDark ? styles.cardDark : null]}
          contentContainerStyle={[
            styles.cardContent,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, isDark ? styles.titleDark : null]}>Notification</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close notification detail"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.closePressed : null]}
            >
              <Ionicons name="close" size={18} color={isDark ? "#CBD5E1" : "#374151"} />
            </Pressable>
          </View>

          <Text style={[styles.itemTitle, isDark ? styles.itemTitleDark : null]}>{title}</Text>
          <Text style={[styles.time, isDark ? styles.timeDark : null]}>{timeLabel}</Text>
          <Text style={[styles.body, isDark ? styles.bodyDark : null]}>{item.body}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  card: {
    maxHeight: "85%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cardDark: {
    borderColor: "#1E293B",
    backgroundColor: "#0B1220",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  titleDark: {
    color: "#F1F5F9",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closePressed: {
    opacity: 0.72,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  itemTitleDark: {
    color: "#E2E8F0",
  },
  time: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  timeDark: {
    color: "#94A3B8",
  },
  body: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  bodyDark: {
    color: "#CBD5E1",
  },
});
