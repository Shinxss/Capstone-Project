import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <ScrollView
        contentContainerClassName="px-5 pb-36 pt-2"
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

      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 30) + 40 }]}>
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
    paddingTop: 0,
    paddingBottom: 0,
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
