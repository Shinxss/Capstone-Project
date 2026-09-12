import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AchievementFilter, AchievementSummary } from "../models/achievement.types";
import { useTheme } from "../../theme/useTheme";

type AchievementFilterTabsProps = {
  filter: AchievementFilter;
  summary: AchievementSummary;
  onChange: (filter: AchievementFilter) => void;
};

export default function AchievementFilterTabs({ filter, summary, onChange }: AchievementFilterTabsProps) {
  const { isDark } = useTheme();
  const filters: ReadonlyArray<{ id: AchievementFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: summary.total },
    { id: "unlocked", label: "Unlocked", count: summary.unlocked },
    { id: "locked", label: "Locked", count: Math.max(0, summary.total - summary.unlocked) },
  ];

  return (
    <View accessibilityRole="tablist" style={{ marginTop: 14, marginBottom: 16, flexDirection: "row", gap: 8 }}>
      {filters.map((item) => {
        const selected = filter === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.label}, ${item.count}`}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => ({
              minWidth: 0,
              flex: 1,
              minHeight: 42,
              paddingHorizontal: 5,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: selected ? "#DC2626" : isDark ? "#334155" : "#CBD5E1",
              backgroundColor: selected ? "#DC2626" : isDark ? "#0E1626" : "#FFFFFF",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={{ color: selected ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569", fontSize: 12, fontWeight: "900" }}>
              {item.label} ({item.count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
