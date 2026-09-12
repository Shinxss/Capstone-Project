import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LEVEL_BADGE_ASSETS } from "../constants/levelAssets";
import type { LevelDefinition, LevelNumber } from "../models/achievement.types";
import { useTheme } from "../../theme/useTheme";

export const LEVEL_MILESTONE_WIDTH = 112;

type LevelMilestoneItemProps = {
  definition: LevelDefinition;
  currentLevel: LevelNumber;
};

export default function LevelMilestoneItem({ definition, currentLevel }: LevelMilestoneItemProps) {
  const { isDark } = useTheme();
  const completed = definition.level < currentLevel;
  const current = definition.level === currentLevel;
  const locked = definition.level > currentLevel;
  const stateLabel = current ? "current" : completed ? "completed" : "locked";
  const badgeSize = current ? 82 : 74;

  return (
    <View
      accessible
      accessibilityLabel={`Level ${definition.level}, ${definition.title}, ${stateLabel}`}
      style={{
        width: LEVEL_MILESTONE_WIDTH,
        height: 166,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: current
          ? "#DC2626"
          : completed
            ? isDark ? "#365314" : "#BBF7D0"
            : isDark ? "#24324A" : "#E2E8F0",
        backgroundColor: current
          ? isDark ? "#28121D" : "#FFF7F7"
          : isDark ? "#0E1626" : "#FFFFFF",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 7,
        paddingTop: current ? 7 : 11,
      }}
    >
      <View style={{ width: 82, height: 82, alignItems: "center", justifyContent: "center" }}>
        <Image
          source={LEVEL_BADGE_ASSETS[definition.level]}
          contentFit="contain"
          transition={100}
          style={{ width: badgeSize, height: badgeSize, opacity: locked ? 0.42 : 1 }}
        />
        {locked ? (
          <View style={{ position: "absolute", right: 2, bottom: 3, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#334155" : "#94A3B8", borderWidth: 2, borderColor: isDark ? "#0E1626" : "#FFFFFF" }}>
            <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
          </View>
        ) : completed ? (
          <View style={{ position: "absolute", right: 2, bottom: 3, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#16A34A", borderWidth: 2, borderColor: isDark ? "#0E1626" : "#FFFFFF" }}>
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <Text style={{ marginTop: 2, color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 12, fontWeight: "900" }}>
        Level {definition.level}
      </Text>
      <Text numberOfLines={2} style={{ marginTop: 3, minHeight: 30, textAlign: "center", color: locked ? (isDark ? "#7C8AA1" : "#94A3B8") : isDark ? "#CBD5E1" : "#475569", fontSize: 10, lineHeight: 14, fontWeight: "700" }}>
        {definition.title}
      </Text>
      {current ? (
        <View style={{ marginTop: 4, borderRadius: 9, backgroundColor: "#DC2626", paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "900" }}>Current</Text>
        </View>
      ) : null}
    </View>
  );
}
