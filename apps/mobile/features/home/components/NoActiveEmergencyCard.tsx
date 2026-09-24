import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/useTheme";

type Props = {
  onPressViewMyRequests?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function NoActiveEmergencyCard({ onPressViewMyRequests, style }: Props) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            isDark ? styles.headerIconDark : styles.headerIconLight,
          ]}
        >
          <Ionicons
            name="radio-button-on"
            size={18}
            color={isDark ? "#34D399" : "#10B981"}
          />
        </View>
        <Text
          style={[
            styles.title,
            isDark ? styles.titleDark : styles.titleLight,
          ]}
          maxFontSizeMultiplier={1.15}
        >
          Active Emergency Request
        </Text>
      </View>

      {/* Status Pill Badge */}
      <View
        style={[
          styles.statusBadge,
          isDark ? styles.statusBadgeDark : styles.statusBadgeLight,
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={isDark ? "#34D399" : "#059669"}
        />
        <Text
          style={[
            styles.statusText,
            isDark ? styles.statusTextDark : styles.statusTextLight,
          ]}
          maxFontSizeMultiplier={1.15}
        >
          No Active Request
        </Text>
      </View>

      {/* Message */}
      <Text
        style={[
          styles.message,
          isDark ? styles.messageDark : styles.messageLight,
        ]}
        maxFontSizeMultiplier={1.2}
      >
        You don't have an active emergency request right now.
      </Text>

      {/* Action Button */}
      {onPressViewMyRequests ? (
        <Pressable
          onPress={onPressViewMyRequests}
          accessibilityRole="button"
          accessibilityLabel="View my requests"
          style={({ pressed }) => [
            styles.actionButton,
            isDark ? styles.actionButtonDark : styles.actionButtonLight,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text
            style={[
              styles.actionButtonText,
              isDark ? styles.actionButtonTextDark : styles.actionButtonTextLight,
            ]}
            maxFontSizeMultiplier={1.15}
          >
            View My Requests
          </Text>
          <Ionicons
            name="arrow-forward"
            size={15}
            color={isDark ? "#38BDF8" : "#0284C7"}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export const NoActiveEmergencyState = NoActiveEmergencyCard;

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  cardDark: {
    backgroundColor: "#0E1626",
    borderColor: "#1E293B",
    shadowOpacity: 0.3,
  },

  header: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerIconLight: {
    backgroundColor: "#ECFDF5",
  },
  headerIconDark: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },

  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "800",
  },
  titleLight: {
    color: "#111827",
  },
  titleDark: {
    color: "#F1F5F9",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeLight: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusBadgeDark: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.28)",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusTextLight: {
    color: "#059669",
  },
  statusTextDark: {
    color: "#34D399",
  },

  message: {
    marginTop: 7,
    fontSize: 13.5,
    lineHeight: 18,
  },
  messageLight: {
    color: "#64748B",
  },
  messageDark: {
    color: "#94A3B8",
  },

  actionButton: {
    height: 38,
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionButtonLight: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  actionButtonDark: {
    backgroundColor: "rgba(2, 132, 199, 0.08)",
    borderColor: "#1E3A5F",
  },
  actionButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  actionButtonTextLight: {
    color: "#0284C7",
  },
  actionButtonTextDark: {
    color: "#38BDF8",
  },

  buttonPressed: {
    opacity: 0.72,
  },
});
