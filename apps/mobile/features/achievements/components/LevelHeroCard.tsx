import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { LEVEL_BADGE_ASSETS } from "../constants/levelAssets";
import type { UserProgression } from "../models/achievement.types";
import { useTheme } from "../../theme/useTheme";
import { useResponsiveLayout } from "../../common/hooks/useResponsiveLayout";
import AchievementProgressBar from "./AchievementProgressBar";

type LevelHeroCardProps = {
  progression: UserProgression;
};

function formatXp(value: number) {
  return value.toLocaleString("en-US");
}

export default function LevelHeroCard({ progression }: LevelHeroCardProps) {
  const { isDark } = useTheme();
  const { isNarrow } = useResponsiveLayout();
  const badgeSize = isNarrow ? 104 : 122;

  return (
    <View
      accessible
      accessibilityLabel={`Current Lifeline level: Level ${progression.currentLevel}, ${progression.currentLevelTitle}. ${formatXp(progression.lifetimeXp)} lifetime XP.`}
      style={{
        overflow: "hidden",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? "#51202C" : "#FECACA",
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        padding: isNarrow ? 16 : 19,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          borderRadius: 95,
          top: -78,
          left: -54,
          backgroundColor: isDark ? "rgba(220,38,38,0.13)" : "rgba(254,202,202,0.42)",
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={LEVEL_BADGE_ASSETS[progression.currentLevel]}
          contentFit="contain"
          transition={120}
          style={{ width: badgeSize, height: badgeSize }}
        />
        <View style={{ flex: 1, minWidth: 0, marginLeft: isNarrow ? 10 : 16 }}>
          <Text
            style={{
              color: "#DC2626",
              fontSize: 11,
              lineHeight: 15,
              fontWeight: "900",
              letterSpacing: 1.5,
            }}
          >
            {progression.maxLevel ? "MAX LEVEL" : "CURRENT LEVEL"}
          </Text>
          <Text
            style={{
              marginTop: 4,
              color: isDark ? "#F8FAFC" : "#0F172A",
              fontSize: isNarrow ? 26 : 30,
              lineHeight: isNarrow ? 31 : 35,
              fontWeight: "900",
            }}
          >
            Level {progression.currentLevel}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              marginTop: 1,
              color: isDark ? "#CBD5E1" : "#334155",
              fontSize: isNarrow ? 14 : 16,
              lineHeight: 21,
              fontWeight: "800",
            }}
          >
            {progression.currentLevelTitle}
          </Text>
          <Text
            style={{
              marginTop: 9,
              color: progression.maxLevel ? (isDark ? "#FCA5A5" : "#B91C1C") : isDark ? "#F8FAFC" : "#111827",
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            {progression.maxLevel ? "Lifetime XP: " : ""}{formatXp(progression.lifetimeXp)}{progression.maxLevel ? "" : " XP"}
          </Text>
        </View>
      </View>

      {!progression.maxLevel && progression.nextLevel ? (
        <View style={{ marginTop: 16 }}>
          <AchievementProgressBar percent={progression.progressPercent} height={10} />
          <View style={{ marginTop: 9, flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <Text style={{ flex: 1, color: isDark ? "#CBD5E1" : "#475569", fontSize: 12, lineHeight: 17, fontWeight: "700" }}>
              {formatXp(progression.xpIntoCurrentLevel)} / {formatXp(progression.xpRequiredForNextLevel)} XP to Level {progression.nextLevel}
            </Text>
            <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "900" }}>
              {progression.progressPercent}%
            </Text>
          </View>
          <Text style={{ marginTop: 3, color: isDark ? "#94A3B8" : "#64748B", fontSize: 12 }}>
            {formatXp(progression.xpRemainingToNextLevel)} XP remaining · {progression.nextLevelTitle}
          </Text>
        </View>
      ) : (
        <Text style={{ marginTop: 14, color: isDark ? "#A8B4C8" : "#64748B", fontSize: 12, lineHeight: 18 }}>
          You reached Lifeline&apos;s highest progression level. Lifetime XP continues to grow with verified contributions.
        </Text>
      )}
    </View>
  );
}
