import React from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type AchievementProgressBarProps = {
  percent: number;
  height?: number;
};

export default function AchievementProgressBar({
  percent,
  height = 7,
}: AchievementProgressBarProps) {
  const { isDark } = useTheme();
  const safePercent = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safePercent) }}
      style={{
        height,
        width: "100%",
        overflow: "hidden",
        borderRadius: height / 2,
        backgroundColor: isDark ? "#26344D" : "#E2E8F0",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${safePercent}%`,
          borderRadius: height / 2,
          backgroundColor: "#DC2626",
        }}
      />
    </View>
  );
}
