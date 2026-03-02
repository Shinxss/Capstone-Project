import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ReportEmergencyHeaderProps = {
  step: number;
  totalSteps?: number;
  title?: string;
  onBack?: () => void;
};

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function ReportEmergencyHeader({
  step,
  totalSteps = 3,
  title = "Report Emergency",
  onBack,
}: ReportEmergencyHeaderProps) {
  const safeTotal = Math.max(1, totalSteps);
  const toProgress = useMemo(() => clampProgress(step / safeTotal), [safeTotal, step]);
  const progressAnim = useRef(new Animated.Value(toProgress)).current;
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      progressAnim.setValue(toProgress);
      initialized.current = true;
      return;
    }

    progressAnim.stopAnimation();
    Animated.timing(progressAnim, {
      toValue: toProgress,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim, toProgress]);

  const progressWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      }),
    [progressAnim]
  );

  return (
    <View className="px-4 pb-4 pt-2">
      <View className="flex-row items-center pb-1">
        <Pressable onPress={onBack} className="h-10 w-10 items-center justify-center">
          <Ionicons name="chevron-back" size={20} color="#18181b" />
        </Pressable>
        <Text className="ml-3 text-2xl font-bold text-zinc-900">{title}</Text>
      </View>

      <View style={{ marginLeft: 52 }}>
        <Text className="text-sm font-medium text-zinc-500">
          Step {step} of {safeTotal}
        </Text>
      </View>

      <View className="mt-3 -mx-4 h-2 overflow-hidden bg-zinc-300">
        <Animated.View
          style={{
            width: progressWidth,
            height: "100%",
            backgroundColor: "#ef4444",
          }}
        />
      </View>
    </View>
  );
}
