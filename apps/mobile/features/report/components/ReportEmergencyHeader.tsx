import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ReportEmergencyHeaderProps = {
  step?: number;
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  progress?: number;
  onBack?: () => void;
  showBackButton?: boolean;
  showProgressBar?: boolean;
  backgroundColor?: string;
};

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function ReportEmergencyHeader({
  step,
  totalSteps = 3,
  title = "Report Emergency",
  subtitle,
  progress,
  onBack,
  showBackButton = true,
  showProgressBar = true,
  backgroundColor,
}: ReportEmergencyHeaderProps) {
  const hasStep = typeof step === "number" && Number.isFinite(step);
  const safeStep = hasStep ? Math.max(1, Math.round(step)) : 1;
  const safeTotal = Math.max(1, totalSteps);
  const helperText = hasStep ? `Step ${safeStep} of ${safeTotal}` : subtitle;
  const toProgress = useMemo(() => {
    if (hasStep) return clampProgress(safeStep / safeTotal);
    if (typeof progress === "number") return clampProgress(progress);
    return 1;
  }, [hasStep, progress, safeStep, safeTotal]);
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
    <View
      className="px-4 pb-4 pt-2"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <View className="flex-row items-center pb-1">
        {showBackButton ? (
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center"
            disabled={!onBack}
          >
            <Ionicons name="arrow-back" size={20} color={onBack ? "#18181b" : "#a1a1aa"} />
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}
        <Text className="ml-3 text-2xl font-bold text-zinc-900">{title}</Text>
      </View>

      {helperText ? (
        <View style={{ marginLeft: 52 }}>
          <Text className="text-sm font-medium text-zinc-500">{helperText}</Text>
        </View>
      ) : null}

      {showProgressBar ? (
        <View className="mt-3 -mx-4 h-2 overflow-hidden bg-zinc-300">
          <Animated.View
            style={{
              width: progressWidth,
              height: "100%",
              backgroundColor: "#ef4444",
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
