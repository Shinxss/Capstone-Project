import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import type { AchievementSummary } from "../models/achievement.types";

type AchievementSummaryCardProps = {
  summary: AchievementSummary;
};

export default function AchievementSummaryCard({ summary }: AchievementSummaryCardProps) {
  const { isDark } = useTheme();
  const stats = [
    { label: "Badges", value: summary.total },
    { label: "Unlocked", value: summary.unlocked },
    { label: "Locked", value: Math.max(0, summary.total - summary.unlocked) },
  ] as const;

  return (
    <View
      accessible
      accessibilityLabel={`${summary.total} badges, ${summary.unlocked} unlocked, ${Math.max(0, summary.total - summary.unlocked)} locked`}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? "#24324A" : "#E2E8F0",
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        flexDirection: "row",
        paddingVertical: 13,
      }}
    >
      {stats.map((stat, index) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            alignItems: "center",
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor: isDark ? "#24324A" : "#E2E8F0",
          }}
        >
          <Text style={{ color: stat.label === "Unlocked" ? "#DC2626" : isDark ? "#F8FAFC" : "#0F172A", fontSize: 19, fontWeight: "900" }}>
            {stat.value}
          </Text>
          <Text style={{ marginTop: 2, color: isDark ? "#94A3B8" : "#64748B", fontSize: 11, fontWeight: "700" }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
