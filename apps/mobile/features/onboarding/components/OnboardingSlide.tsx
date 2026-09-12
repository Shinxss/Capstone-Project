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
  const isRoutesSlide = item.id === "routes";
  const illustrationWidth = isRoutesSlide
    ? Math.min(404, Math.max(264, width - (compact ? 24 : 32)))
    : Math.min(440, Math.max(280, width));
  const illustrationHeight = isRoutesSlide
    ? Math.round((illustrationWidth * 315) / 440)
    : "100%";

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

      <View
        style={[
          styles.illustrationArea,
          isRoutesSlide && styles.routesIllustrationArea,
        ]}
      >
        <Illustration
          width={illustrationWidth}
          height={illustrationHeight}
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
  routesIllustrationArea: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
