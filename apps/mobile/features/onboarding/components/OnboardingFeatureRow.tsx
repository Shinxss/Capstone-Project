import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { OnboardingFeatureData } from "../constants/onboarding.constants";
import { ONBOARDING_COLORS } from "../constants/onboarding.constants";

type Props = {
  features: readonly OnboardingFeatureData[];
  compact: boolean;
};

export function OnboardingFeatureRow({ features, compact }: Props) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {features.map(({ Icon, title, description }) => (
        <View key={title} style={styles.feature}>
          <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
            <Icon
              size={compact ? 20 : 23}
              strokeWidth={2.5}
              color={ONBOARDING_COLORS.primary}
              accessibilityElementsHidden
            />
          </View>
          <Text
            numberOfLines={2}
            style={[styles.title, compact && styles.titleCompact]}
            maxFontSizeMultiplier={1.1}
          >
            {title}
          </Text>
          <Text
            numberOfLines={3}
            style={[styles.description, compact && styles.descriptionCompact]}
            maxFontSizeMultiplier={1.1}
          >
            {description}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minHeight: 126,
    paddingHorizontal: 12,
    paddingTop: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  rowCompact: {
    minHeight: 108,
    paddingHorizontal: 8,
    paddingTop: 2,
    gap: 4,
  },
  feature: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ONBOARDING_COLORS.featureIconBackground,
  },
  iconCircleCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  title: {
    minHeight: 31,
    marginTop: 7,
    color: ONBOARDING_COLORS.heading,
    fontSize: 12.5,
    lineHeight: 15.5,
    fontWeight: "700",
    textAlign: "center",
  },
  titleCompact: {
    minHeight: 27,
    marginTop: 5,
    fontSize: 11.5,
    lineHeight: 13.5,
  },
  description: {
    marginTop: 3,
    paddingHorizontal: 2,
    color: ONBOARDING_COLORS.secondaryText,
    fontSize: 11.25,
    lineHeight: 15,
    fontWeight: "400",
    textAlign: "center",
  },
  descriptionCompact: {
    marginTop: 1,
    fontSize: 10.25,
    lineHeight: 13,
  },
});
