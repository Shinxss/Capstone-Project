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
      <View style={{ height: 220, borderRadius: 24, backgroundColor: card, borderWidth: 1, borderColor: border, padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: fill }} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ width: 92, height: 11, borderRadius: 6, backgroundColor: fill }} />
            <View style={{ marginTop: 10, width: "75%", height: 29, borderRadius: 10, backgroundColor: fill }} />
            <View style={{ marginTop: 9, width: "90%", height: 16, borderRadius: 8, backgroundColor: fill }} />
            <View style={{ marginTop: 13, width: 72, height: 17, borderRadius: 8, backgroundColor: fill }} />
          </View>
        </View>
        <View style={{ marginTop: 18, width: "100%", height: 10, borderRadius: 5, backgroundColor: fill }} />
      </View>
      <View style={{ marginTop: 18, width: 130, height: 17, borderRadius: 8, backgroundColor: fill }} />
      <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={{ minWidth: 0, flex: 1, height: 166, borderRadius: 18, backgroundColor: card, borderWidth: 1, borderColor: border, alignItems: "center", paddingTop: 13 }}>
            <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: fill }} />
            <View style={{ marginTop: 9, width: "62%", height: 12, borderRadius: 6, backgroundColor: fill }} />
          </View>
        ))}
      </View>
      <View style={{ marginTop: 14, height: 66, borderRadius: 18, backgroundColor: card, borderWidth: 1, borderColor: border }} />
      <View style={{ marginTop: 14, flexDirection: "row", gap: 8 }}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: fill }} />
        ))}
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <View
            key={item}
            style={{
              width: cardWidth,
              height: 164,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              alignItems: "center",
              padding: 9,
            }}
          >
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: fill }} />
            <View style={{ marginTop: 8, width: "86%", height: 14, borderRadius: 7, backgroundColor: fill }} />
            <View style={{ marginTop: 6, width: "62%", height: 10, borderRadius: 5, backgroundColor: fill }} />
          </View>
        ))}
      </View>
    </View>
  );
}
