import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";

type Props = {
  visible: boolean;
  onViewStatus: () => void;
  onBackToProfile: () => void;
};

export function VolunteerApplicationSuccessModal({
  visible,
  onViewStatus,
  onBackToProfile,
}: Props) {
  const { isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onBackToProfile}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
              borderColor: isDark ? "#1E293B" : "#E2E8F0",
            },
          ]}
        >
          {/* Success Icon */}
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#DCFCE7",
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={44} color="#16A34A" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDark ? "#F1F5F9" : "#0F172A" }]}>
            Application Submitted
          </Text>

          {/* Primary Message */}
          <Text style={[styles.message, { color: isDark ? "#CBD5E1" : "#334155" }]}>
            Your volunteer application has been received and is now waiting for LGU verification.
          </Text>

          {/* Secondary Message */}
          <Text style={[styles.secondaryMessage, { color: isDark ? "#94A3B8" : "#64748B" }]}>
            We'll notify you when your application status changes.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onViewStatus}
              accessibilityRole="button"
              accessibilityLabel="View Application Status"
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: isDark ? "#2563EB" : "#DC2626",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>View Application Status</Text>
            </Pressable>

            <Pressable
              onPress={onBackToProfile}
              accessibilityRole="button"
              accessibilityLabel="Back to Profile"
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  borderColor: isDark ? "#1E293B" : "#CBD5E1",
                  backgroundColor: isDark ? "#162544" : "#F8FAFC",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: isDark ? "#E2E8F0" : "#475569" }]}>
                Back to Profile
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  secondaryMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 22,
  },
  actions: {
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    width: "100%",
    minHeight: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
