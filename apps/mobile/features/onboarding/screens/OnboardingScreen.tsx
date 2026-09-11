import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LifelineLogo from "../../../assets/lifeline_logo_trans.svg";
import { OnboardingPagination } from "../components/OnboardingPagination";
import { OnboardingSlide } from "../components/OnboardingSlide";
import {
  ONBOARDING_COLORS,
  ONBOARDING_SLIDES,
  type OnboardingSlideData,
} from "../constants/onboarding.constants";
import { useOnboarding } from "../OnboardingProvider";

const LAST_SLIDE_INDEX = ONBOARDING_SLIDES.length - 1;

export function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const { completeOnboarding } = useOnboarding();
  const listRef = useRef<FlatList<OnboardingSlideData>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const compact = height < 720 || width < 360;
  const currentSlide = ONBOARDING_SLIDES[activeIndex] ?? ONBOARDING_SLIDES[0];
  const logoHeight = compact ? 104 : 126;
  const logoWidth = Math.round((logoHeight * 269) / 274);

  const updateActiveIndex = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.max(
        0,
        Math.min(
          LAST_SLIDE_INDEX,
          Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1))
        )
      );
      setActiveIndex(nextIndex);
    },
    [width]
  );

  const finishOnboarding = useCallback(async () => {
    if (completing) return;

    setCompleting(true);
    try {
      await completeOnboarding();
      router.replace("/(auth)/login");
    } catch {
      setCompleting(false);
      Alert.alert(
        "Unable to continue",
        "Lifeline could not save your onboarding progress. Please try again."
      );
    }
  }, [completeOnboarding, completing]);

  const handlePrimaryPress = useCallback(() => {
    if (activeIndex === LAST_SLIDE_INDEX) {
      void finishOnboarding();
      return;
    }

    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [activeIndex, finishOnboarding]);

  const renderSlide = useCallback(
    ({ item }: { item: OnboardingSlideData }) => (
      <OnboardingSlide item={item} width={width} compact={compact} />
    ),
    [compact, width]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" backgroundColor={ONBOARDING_COLORS.background} />

      <View style={[styles.logoArea, compact && styles.logoAreaCompact]}>
        <LifelineLogo
          width={logoWidth}
          height={logoHeight}
          preserveAspectRatio="xMidYMid meet"
          accessibilityRole="image"
          accessibilityLabel="Lifeline"
        />
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateActiveIndex}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        style={styles.pages}
        contentContainerStyle={styles.pagesContent}
        accessibilityLabel="Lifeline onboarding pages"
      />

      <View style={[styles.footer, compact && styles.footerCompact]}>
        <OnboardingPagination
          activeIndex={activeIndex}
          count={ONBOARDING_SLIDES.length}
        />

        <Pressable
          onPress={handlePrimaryPress}
          disabled={completing}
          accessibilityRole="button"
          accessibilityLabel={currentSlide.buttonLabel}
          style={({ pressed }) => [
            styles.button,
            compact && styles.buttonCompact,
            pressed && !completing ? styles.buttonPressed : null,
            completing ? styles.buttonDisabled : null,
          ]}
        >
          <Text style={styles.buttonLabel} maxFontSizeMultiplier={1.15}>
            {completing ? "Getting Started..." : currentSlide.buttonLabel}
          </Text>
          <Ionicons name="arrow-forward" size={25} color="#FFFFFF" style={styles.arrow} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ONBOARDING_COLORS.background,
  },
  logoArea: {
    height: 138,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  logoAreaCompact: {
    height: 110,
    paddingTop: 0,
  },
  pages: {
    flex: 1,
  },
  pagesContent: {
    alignItems: "stretch",
  },
  footer: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 14,
  },
  footerCompact: {
    paddingTop: 4,
    paddingBottom: 6,
    gap: 8,
  },
  button: {
    height: 58,
    borderRadius: 29,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ONBOARDING_COLORS.primary,
  },
  buttonCompact: {
    height: 54,
    borderRadius: 27,
  },
  buttonPressed: {
    backgroundColor: ONBOARDING_COLORS.primaryPressed,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  arrow: {
    position: "absolute",
    right: 24,
  },
});
