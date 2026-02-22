import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { EMERGENCY_TYPE_OPTIONS } from "../constants/emergencyTypes.constants";
import { EmergencyTypeTile } from "../components/EmergencyTypeTile";
import type { EmergencyType } from "../models/report.types";
import { useReportDraft } from "../hooks/useReportDraft";

export function ReportEmergencyTypeScreen() {
  const { draft, setType } = useReportDraft();
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(draft.type ?? null);

  const canContinue = useMemo(() => selectedType !== null, [selectedType]);

  const onContinue = () => {
    if (!selectedType) return;

    setType(selectedType);

    router.push("/report/details");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pb-2 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border border-zinc-200"
        >
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text className="ml-3 text-xl font-bold text-zinc-900">Report Emergency</Text>
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

      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-5 pb-6 pt-3">
        <Pressable
          onPress={onContinue}
          disabled={!canContinue}
          className={`h-12 items-center justify-center rounded-2xl ${
            canContinue ? "bg-red-500" : "bg-zinc-300"
          }`}
        >
          <Text className="text-base font-semibold text-white">Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
