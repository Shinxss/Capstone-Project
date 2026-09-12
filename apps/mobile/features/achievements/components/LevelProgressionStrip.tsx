import React, { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { LEVEL_DEFINITIONS } from "../constants/levelUi.constants";
import type { LevelNumber } from "../models/achievement.types";
import { useTheme } from "../../theme/useTheme";
import LevelMilestoneItem, { LEVEL_MILESTONE_WIDTH } from "./LevelMilestoneItem";

const ITEM_GAP = 10;

type LevelProgressionStripProps = {
  currentLevel: LevelNumber;
};

export default function LevelProgressionStrip({ currentLevel }: LevelProgressionStripProps) {
  const { isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    if (viewportWidth <= 0) return;
    const currentIndex = currentLevel - 1;
    const currentCenter = currentIndex * (LEVEL_MILESTONE_WIDTH + ITEM_GAP) + LEVEL_MILESTONE_WIDTH / 2;
    scrollRef.current?.scrollTo({
      x: Math.max(0, currentCenter - viewportWidth / 2),
      animated: true,
    });
  }, [currentLevel, viewportWidth]);

  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 16, fontWeight: "900" }}>
          Level Progression
        </Text>
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 11, fontWeight: "700" }}>
          10 levels
        </Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={{ paddingTop: 10, paddingRight: 8, gap: ITEM_GAP }}
      >
        {LEVEL_DEFINITIONS.map((definition) => (
          <LevelMilestoneItem
            key={definition.level}
            definition={definition}
            currentLevel={currentLevel}
          />
        ))}
      </ScrollView>
    </View>
  );
}
