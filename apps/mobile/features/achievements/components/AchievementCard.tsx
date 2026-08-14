import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { Achievement } from "../models/achievement.types";
import AchievementBadge from "./AchievementBadge";
import AchievementProgressBar from "./AchievementProgressBar";

type AchievementCardProps = {
  achievement: Achievement;
  width: number;
  badgeSize: number;
  onPress: () => void;
};

function formatUnlockDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AchievementCard({
  achievement,
  width,
  badgeSize,
  onPress,
}: AchievementCardProps) {
  const { isDark } = useTheme();
  const statusLabel = achievement.unlocked ? "unlocked" : achievement.progress.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${achievement.title} achievement, ${statusLabel}`}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        minHeight: 350,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: achievement.unlocked
          ? isDark
            ? "#7F1D1D"
            : "#FCA5A5"
          : isDark
            ? "#24324A"
            : "#E2E8F0",
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 14,
        opacity: pressed ? 0.84 : 1,
      })}
    >
      <View style={{ alignItems: "center" }}>
        <AchievementBadge
          achievementId={achievement.id}
          unlocked={achievement.unlocked}
          size={badgeSize}
        />
      </View>

      <Text
        style={{
          marginTop: 10,
          minHeight: 40,
          textAlign: "center",
          color: isDark ? "#F8FAFC" : "#0F172A",
          fontSize: 15,
          lineHeight: 20,
          fontWeight: "800",
        }}
      >
        {achievement.title}
      </Text>
      <Text
        style={{
          marginTop: 7,
          flexGrow: 1,
          textAlign: "center",
          color: isDark ? "#A8B4C8" : "#64748B",
          fontSize: 12,
          lineHeight: 17,
        }}
      >
        {achievement.description}
      </Text>

      {achievement.unlocked ? (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={17} color="#16A34A" />
            <Text style={{ marginLeft: 4, color: isDark ? "#86EFAC" : "#15803D", fontSize: 12, fontWeight: "800" }}>
              Unlocked
            </Text>
          </View>
          {achievement.unlockedAt ? (
            <Text style={{ marginTop: 3, color: isDark ? "#94A3B8" : "#64748B", fontSize: 11 }}>
              {formatUnlockDate(achievement.unlockedAt)}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <Text
            numberOfLines={2}
            style={{
              minHeight: 30,
              marginBottom: 7,
              textAlign: "center",
              color: isDark ? "#CBD5E1" : "#475569",
              fontSize: 11,
              lineHeight: 15,
              fontWeight: "700",
            }}
          >
            {achievement.progress.label}
          </Text>
          <AchievementProgressBar percent={achievement.progress.percent} />
        </View>
      )}
    </Pressable>
  );
}
