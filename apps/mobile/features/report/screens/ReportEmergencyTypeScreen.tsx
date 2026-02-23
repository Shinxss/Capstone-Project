import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { EMERGENCY_TYPE_OPTIONS } from "../constants/emergencyTypes.constants";
import { EmergencyTypeTile } from "../components/EmergencyTypeTile";
import type { EmergencyType } from "../models/report.types";
import { useReportDraft } from "../hooks/useReportDraft";

export function ReportEmergencyTypeScreen() {
  const insets = useSafeAreaInsets();
  const { draft, setType } = useReportDraft();
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(draft.type ?? null);

  const canContinue = useMemo(() => selectedType !== null, [selectedType]);

  const onContinue = () => {
    if (!selectedType) return;

    setType(selectedType);

    router.push("/report/details");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text className="ml-4 text-2xl font-bold text-zinc-900">Report Emergency</Text>
      </View>

      <View className="px-5 pb-3">
        <Text className="text-sm font-medium text-zinc-500">Step 1 of 3</Text>
        <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <View className="h-full w-1/3 rounded-full bg-red-500" />
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-36"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-extrabold text-zinc-900">What type of emergency?</Text>
        <Text className="mt-1 text-sm text-zinc-500">
          Select the category that best describes the situation
        </Text>

        <View className="mt-6 flex-row flex-wrap justify-between">
          {EMERGENCY_TYPE_OPTIONS.map((option) => (
            <EmergencyTypeTile
              key={option.key}
              option={option}
              selected={selectedType === option.key}
              onPress={() => setSelectedType(option.key)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={onContinue}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  continueBtn: {
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  continueBtnDisabled: {
    backgroundColor: "#EC8585",
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 33 / 2,
    fontWeight: "600",
  },
});
