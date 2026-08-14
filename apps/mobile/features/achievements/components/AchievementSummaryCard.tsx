import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import type { AchievementSummary } from "../models/achievement.types";
import AchievementProgressBar from "./AchievementProgressBar";

type AchievementSummaryCardProps = {
  summary: AchievementSummary;
};

export default function AchievementSummaryCard({ summary }: AchievementSummaryCardProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: isDark ? "#24324A" : "#FECACA",
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        padding: 18,
      }}
    >
      <Text style={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 16, fontWeight: "800" }}>
        Achievement Progress
      </Text>
      <View style={{ marginTop: 10, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={{ color: isDark ? "#F8FAFC" : "#111827", fontSize: 24, fontWeight: "900" }}>
          {summary.unlocked} / {summary.total} Unlocked
        </Text>
        <Text style={{ color: "#DC2626", fontSize: 16, fontWeight: "900" }}>{summary.percent}%</Text>
      </View>
      <View style={{ marginTop: 13 }}>
        <AchievementProgressBar percent={summary.percent} height={9} />
      </View>
      <Text
        style={{
          marginTop: 12,
          color: isDark ? "#A8B4C8" : "#64748B",
          fontSize: 13,
          lineHeight: 19,
        }}
      >
        Keep responding and supporting your community to unlock more badges.
      </Text>
    </View>
  );
}
