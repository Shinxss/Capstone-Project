import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ONBOARDING_COLORS } from "../constants/onboarding.constants";

type Props = {
  activeIndex: number;
  count: number;
};

export function OnboardingPagination({ activeIndex, count }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={`Onboarding page ${activeIndex + 1} of ${count}`}
    >
      <View style={styles.dots}>
        {Array.from({ length: count }, (_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.activeDot]}
          />
        ))}
      </View>
      <Text style={styles.count} maxFontSizeMultiplier={1.1}>
        {activeIndex + 1}/{count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ONBOARDING_COLORS.inactivePagination,
  },
  activeDot: {
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  count: {
    color: ONBOARDING_COLORS.mutedText,
    fontSize: 14,
    fontWeight: "500",
  },
});
