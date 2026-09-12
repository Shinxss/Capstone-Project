import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { Achievement } from "../models/achievement.types";
import AchievementBadge from "./AchievementBadge";

type AchievementCardProps = {
  achievement: Achievement;
  width: number;
  badgeSize: number;
  onPress: () => void;
};

export default function AchievementCard({
  achievement,
  width,
  badgeSize,
  onPress,
}: AchievementCardProps) {
  const { isDark } = useTheme();
  const statusLabel = achievement.unlocked
    ? "unlocked"
    : `locked, ${achievement.progress.percent} percent progress`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${achievement.title} achievement, ${statusLabel}`}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height: 164,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: achievement.unlocked
          ? isDark
            ? "#7F1D1D"
            : "#FCA5A5"
          : isDark
            ? "#24324A"
            : "#E2E8F0",
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        paddingHorizontal: 6,
        paddingVertical: 9,
        opacity: pressed ? 0.84 : 1,
      })}
    >
      <View style={{ alignItems: "center" }}>
        <AchievementBadge
          achievementId={achievement.id}
          unlocked={achievement.unlocked}
          size={badgeSize}
          showLock={false}
        />
      </View>

      <Text
        style={{
          marginTop: 5,
          minHeight: 32,
          textAlign: "center",
          color: achievement.unlocked
            ? isDark ? "#F8FAFC" : "#0F172A"
            : isDark ? "#94A3B8" : "#64748B",
          fontSize: 11,
          lineHeight: 15,
          fontWeight: "900",
        }}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      <View style={{ marginTop: 5, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <Ionicons
          name={achievement.unlocked ? "checkmark-circle" : "lock-closed"}
          size={13}
          color={achievement.unlocked ? "#16A34A" : isDark ? "#64748B" : "#94A3B8"}
        />
        <Text style={{ marginLeft: 3, color: achievement.unlocked ? (isDark ? "#86EFAC" : "#15803D") : isDark ? "#94A3B8" : "#64748B", fontSize: 10, fontWeight: "800" }}>
          {achievement.unlocked ? "Unlocked" : "Locked"}
        </Text>
      </View>
    </Pressable>
  );
}
