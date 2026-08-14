import React from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type AchievementsSkeletonProps = {
  cardWidth: number;
};

export default function AchievementsSkeleton({ cardWidth }: AchievementsSkeletonProps) {
  const { isDark } = useTheme();
  const fill = isDark ? "#1B2A45" : "#E5E7EB";
  const card = isDark ? "#0E1626" : "#FFFFFF";
  const border = isDark ? "#24324A" : "#E2E8F0";

  return (
    <View accessibilityLabel="Loading achievements">
      <View style={{ height: 150, borderRadius: 22, backgroundColor: card, borderWidth: 1, borderColor: border, padding: 18 }}>
        <View style={{ width: 150, height: 16, borderRadius: 8, backgroundColor: fill }} />
        <View style={{ marginTop: 16, width: 210, height: 26, borderRadius: 10, backgroundColor: fill }} />
        <View style={{ marginTop: 18, width: "100%", height: 9, borderRadius: 5, backgroundColor: fill }} />
      </View>
      <View style={{ marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[0, 1, 2, 3].map((item) => (
          <View
            key={item}
            style={{
              width: cardWidth,
              height: 350,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              alignItems: "center",
              padding: 14,
            }}
          >
            <View style={{ width: 106, height: 106, borderRadius: 53, backgroundColor: fill }} />
            <View style={{ marginTop: 18, width: "80%", height: 16, borderRadius: 8, backgroundColor: fill }} />
            <View style={{ marginTop: 10, width: "100%", height: 54, borderRadius: 10, backgroundColor: fill }} />
          </View>
        ))}
      </View>
    </View>
  );
}
