import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { OnboardingSlideData } from "../constants/onboarding.constants";
import { ONBOARDING_COLORS } from "../constants/onboarding.constants";

type Props = {
  item: OnboardingSlideData;
  width: number;
  compact: boolean;
};

export function OnboardingSlide({ item, width, compact }: Props) {
  const { Illustration } = item;
  const illustrationWidth = Math.min(440, Math.max(280, width - (compact ? 20 : 28)));

  return (
    <View style={[styles.slide, { width, paddingHorizontal: compact ? 14 : 20 }]}>
      <View style={styles.illustrationArea}>
        <Illustration
          width={illustrationWidth}
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          accessibilityRole="image"
          accessibilityLabel={item.illustrationLabel}
        />
      </View>

      <View style={[styles.copy, compact && styles.copyCompact]}>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          maxFontSizeMultiplier={1.15}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.description, compact && styles.descriptionCompact]}
          maxFontSizeMultiplier={1.2}
        >
          {item.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
  },
  illustrationArea: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    minHeight: 112,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    paddingTop: 4,
  },
  copyCompact: {
    minHeight: 96,
    paddingTop: 0,
  },
  title: {
    color: ONBOARDING_COLORS.heading,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.45,
  },
  titleCompact: {
    fontSize: 25,
    lineHeight: 29,
  },
  description: {
    maxWidth: 350,
    marginTop: 8,
    color: ONBOARDING_COLORS.secondaryText,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "400",
    textAlign: "center",
  },
  descriptionCompact: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 19,
  },
});
