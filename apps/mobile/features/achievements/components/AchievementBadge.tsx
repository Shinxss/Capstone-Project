import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ACHIEVEMENT_BADGE_ASSETS } from "../constants/achievementAssets";
import type { AchievementId } from "../models/achievement.types";

type AchievementBadgeProps = {
  achievementId: AchievementId;
  unlocked: boolean;
  size: number;
  showLock?: boolean;
};

export default function AchievementBadge({
  achievementId,
  unlocked,
  size,
  showLock = true,
}: AchievementBadgeProps) {
  const lockSize = Math.max(28, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Image
        source={ACHIEVEMENT_BADGE_ASSETS[achievementId]}
        contentFit="contain"
        transition={120}
        style={{ width: size, height: size, opacity: unlocked ? 1 : 0.48 }}
      />
      {!unlocked && showLock ? (
        <View
          style={[
            styles.lock,
            {
              width: lockSize,
              height: lockSize,
              borderRadius: lockSize / 2,
              right: Math.max(0, Math.round(size * 0.04)),
              bottom: Math.max(0, Math.round(size * 0.04)),
            },
          ]}
        >
          <Ionicons name="lock-closed" size={Math.round(lockSize * 0.54)} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lock: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.88)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
});
