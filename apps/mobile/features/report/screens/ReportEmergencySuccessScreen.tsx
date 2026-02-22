import React from "react";
import { Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useReportDraft } from "../hooks/useReportDraft";

type SearchParams = {
  incidentId?: string;
  referenceNumber?: string;
  isSos?: string;
};

export function ReportEmergencySuccessScreen() {
  const { incidentId, referenceNumber, isSos } = useLocalSearchParams<SearchParams>();
  const { reset } = useReportDraft();
  const sosMode = String(isSos ?? "") === "1";

  const onCopyReference = async () => {
    const value = String(referenceNumber ?? "").trim();
    if (!value) return;
    await Clipboard.setStringAsync(value);
    Alert.alert("Copied", "Reference number copied to clipboard.");
  };

  const onBackHome = () => {
    reset();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5 py-5">
      <Text className="text-sm font-medium text-zinc-500">Step 3 of 3</Text>
      <Text className="mt-2 text-3xl font-extrabold text-zinc-900">
        {sosMode ? "SOS Sent" : "Report Submitted"}
      </Text>

      <Text className="mt-2 text-sm text-zinc-600">
        {sosMode ? "Your SOS has been sent to responders." : "Submitted for LGU verification."}
      </Text>

      <View className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <Text className="text-sm text-zinc-500">Incident ID</Text>
        <Text className="mt-1 text-sm font-semibold text-zinc-800">{incidentId || "N/A"}</Text>

        <Text className="mt-4 text-sm text-zinc-500">Reference Number</Text>
        <Text className="mt-1 text-lg font-bold text-zinc-900">{referenceNumber || "N/A"}</Text>

        <Pressable
          onPress={onCopyReference}
          disabled={!referenceNumber}
          className={`mt-4 h-11 items-center justify-center rounded-xl ${
            referenceNumber ? "bg-zinc-900" : "bg-zinc-300"
          }`}
        >
          <Text className="text-base font-semibold text-white">Copy Reference</Text>
        </Pressable>

        <Text className="mt-3 text-xs text-zinc-500">Keep this reference for tracking.</Text>
      </View>

      <View className="mt-8 gap-3">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/map",
              params: incidentId ? { incidentId } : undefined,
            })
          }
          className="h-12 items-center justify-center rounded-2xl border border-zinc-300"
        >
          <Text className="text-base font-semibold text-zinc-800">View on Map</Text>
        </Pressable>

        <Pressable onPress={onBackHome} className="h-12 items-center justify-center rounded-2xl bg-red-500">
          <Text className="text-base font-semibold text-white">Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
