import React from "react";
import { View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../features/theme/useTheme";

const DEFAULT_GRADIENT_HEIGHT = 220;

type GradientScreenProps = {
  children: React.ReactNode;
  gradientHeight?: number;
  style?: ViewStyle;
};

export default function GradientScreen({
  children,
  gradientHeight = DEFAULT_GRADIENT_HEIGHT,
  style,
}: GradientScreenProps) {
  const { isDark } = useTheme();

  const gradientColors = isDark
    ? (["rgba(11,18,32,0.95)", "rgba(11,18,32,0.55)", "rgba(6,12,24,0)"] as const)
    : (["#F8DCDD", "#FDF2F2", "rgba(255,255,255,0)"] as const);

  return (
    <View
      className="flex-1 bg-lgu-lightBg dark:bg-lgu-darkBg"
      style={[{ backgroundColor: isDark ? "#060C18" : "#F6F7F9" }, style]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={gradientColors}
        locations={[0, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: gradientHeight,
        }}
      />

      <SafeAreaView className="flex-1 bg-transparent" edges={["top", "left", "right"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}
