import React from "react";
import { Pressable, SafeAreaView, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import type { EmergencyType } from "../models/report.types";

type SearchParams = {
  emergencyType?: EmergencyType;
};

export function ReportEmergencyConfirmScreen() {
  const { emergencyType } = useLocalSearchParams<SearchParams>();

  return (
    <SafeAreaView className="flex-1 bg-white px-5 py-5">
      <Text className="text-sm font-medium text-zinc-500">Step 3 of 3</Text>
      <Text className="mt-2 text-2xl font-extrabold text-zinc-900">Confirm Report</Text>
      <Text className="mt-2 text-base text-zinc-600">
        Placeholder screen. Emergency type: {String(emergencyType ?? "unknown")}
      </Text>

      <Pressable
        onPress={() => router.replace("/(tabs)")}
        className="mt-8 h-12 items-center justify-center rounded-2xl bg-red-500"
      >
        <Text className="text-base font-semibold text-white">Finish</Text>
      </Pressable>
    </SafeAreaView>
  );
}
