import React from "react";
import { View, Text } from "react-native";
import LifelineLogoRed from "../assets/lifeline-logo_red.svg";
import LifelineLogoBlue from "../assets/lifeline-logo_blue.svg";
import { useTheme } from "../features/theme/useTheme";

type LifelineLogoProps = {
  variant?: "adaptive" | "red";
};

export default function LifelineLogo({ variant = "adaptive" }: LifelineLogoProps) {
  const { isDark } = useTheme();
  const useRedLogo = variant === "red" || !isDark;
  const LogoIcon = useRedLogo ? LifelineLogoRed : LifelineLogoBlue;

  return (
    <View className="flex-row items-center justify-center gap-1">
      <LogoIcon width={50} height={50} accessibilityLabel="Lifeline" />
      <Text className="text-[40px] font-bold">
        <Text style={{ color: useRedLogo ? "#DC2626" : "#3C83F6" }}>ife</Text>
        <Text style={{ color: variant === "red" || !isDark ? "#6B7280" : "#CBD5E1" }}>
          {"line"}
        </Text>
      </Text>
    </View>
  );
}
