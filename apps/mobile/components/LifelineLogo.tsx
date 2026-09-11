import React from "react";
import { View, Text } from "react-native";
import LifelineLogoRed from "../assets/lifeline-logo_red.svg";
import LifelineLogoBlue from "../assets/lifeline-logo_blue.svg";
import { useTheme } from "../features/theme/useTheme";

export default function LifelineLogo() {
  const { isDark } = useTheme();
  const LogoIcon = isDark ? LifelineLogoBlue : LifelineLogoRed;

  return (
    <View className="flex-row items-center justify-center gap-1">
      <LogoIcon width={50} height={50} accessibilityLabel="Lifeline" />
      <Text className="text-[40px] font-bold">
        <Text style={{ color: isDark ? "#3C83F6" : "#DC2626" }}>ife</Text>
        <Text className="text-gray-500 dark:text-slate-300">line</Text>
      </Text>
    </View>
  );
}
