import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { OnboardingSlideData } from "../constants/onboarding.constants";
import { ONBOARDING_COLORS } from "../constants/onboarding.constants";
import { OnboardingFeatureRow } from "./OnboardingFeatureRow";

type Props = {
  item: OnboardingSlideData;
  width: number;
  compact: boolean;
};

export function OnboardingSlide({ item, width, compact }: Props) {
  const { Illustration } = item;
  const illustrationWidth = Math.min(440, Math.max(280, width));

  return (
    <View style={[styles.slide, { width }]}>
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

      <View style={styles.illustrationArea}>
        <Illustration
          width={illustrationWidth}
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          accessibilityRole="image"
          accessibilityLabel={item.illustrationLabel}
        />
      </View>

      <OnboardingFeatureRow features={item.features} compact={compact} />
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
    minHeight: 88,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  copyCompact: {
    minHeight: 74,
    paddingTop: 0,
  },
  title: {
    color: ONBOARDING_COLORS.heading,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.45,
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 27,
  },
  description: {
    maxWidth: 350,
    marginTop: 6,
    color: ONBOARDING_COLORS.secondaryText,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "center",
  },
  descriptionCompact: {
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 18,
  },
});
