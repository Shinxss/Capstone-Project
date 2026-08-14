import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import { useResponsiveLayout } from "../../common/hooks/useResponsiveLayout";
import type { Achievement } from "../models/achievement.types";
import AchievementBadge from "./AchievementBadge";
import AchievementProgressBar from "./AchievementProgressBar";

type AchievementDetailModalProps = {
  achievement: Achievement | null;
  onClose: () => void;
};

function formatUnlockDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function AchievementDetailModal({
  achievement,
  onClose,
}: AchievementDetailModalProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useResponsiveLayout();
  const badgeSize = Math.min(180, Math.max(138, width * 0.4));
  const unlockDate = formatUnlockDate(achievement?.unlockedAt ?? null);

  return (
    <Modal
      visible={achievement !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 18,
          paddingTop: Math.max(insets.top, 18),
          paddingBottom: Math.max(insets.bottom, 18),
          backgroundColor: "rgba(2,6,23,0.68)",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close achievement details"
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        {achievement ? (
          <View
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: height * 0.85,
              alignSelf: "center",
              overflow: "hidden",
              borderRadius: 28,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#FECACA",
              backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
            }}
          >
            <View style={{ alignItems: "flex-end", paddingHorizontal: 14, paddingTop: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "#1B2A45" : "#F1F5F9",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons name="close" size={21} color={isDark ? "#F8FAFC" : "#0F172A"} />
              </Pressable>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", paddingHorizontal: 22, paddingBottom: 26 }}
            >
              <AchievementBadge
                achievementId={achievement.id}
                unlocked={achievement.unlocked}
                size={badgeSize}
              />
              <Text
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  fontSize: 22,
                  lineHeight: 28,
                  fontWeight: "900",
                }}
              >
                {achievement.title}
              </Text>
              <Text
                style={{
                  marginTop: 9,
                  textAlign: "center",
                  color: isDark ? "#A8B4C8" : "#64748B",
                  fontSize: 14,
                  lineHeight: 21,
                }}
              >
                {achievement.description}
              </Text>

              <View
                style={{
                  width: "100%",
                  marginTop: 20,
                  borderRadius: 18,
                  backgroundColor: isDark ? "#121E32" : "#F8FAFC",
                  padding: 15,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: isDark ? "#CBD5E1" : "#475569", fontSize: 13, fontWeight: "700" }}>
                    Status
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={achievement.unlocked ? "checkmark-circle" : "lock-closed"}
                      size={16}
                      color={achievement.unlocked ? "#16A34A" : isDark ? "#CBD5E1" : "#64748B"}
                    />
                    <Text
                      style={{
                        marginLeft: 5,
                        color: achievement.unlocked ? (isDark ? "#86EFAC" : "#15803D") : isDark ? "#CBD5E1" : "#475569",
                        fontSize: 13,
                        fontWeight: "800",
                      }}
                    >
                      {achievement.unlocked ? "Unlocked" : "Locked"}
                    </Text>
                  </View>
                </View>

                {achievement.unlocked ? (
                  unlockDate ? (
                    <Text style={{ marginTop: 10, color: isDark ? "#A8B4C8" : "#64748B", fontSize: 13 }}>
                      Earned on {unlockDate}
                    </Text>
                  ) : null
                ) : (
                  <View style={{ marginTop: 13 }}>
                    <Text style={{ marginBottom: 8, color: isDark ? "#CBD5E1" : "#475569", fontSize: 13, fontWeight: "700" }}>
                      {achievement.progress.label}
                    </Text>
                    <AchievementProgressBar percent={achievement.progress.percent} height={9} />
                    <Text style={{ marginTop: 7, textAlign: "right", color: "#DC2626", fontSize: 12, fontWeight: "800" }}>
                      {achievement.progress.percent}%
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
