import React from "react";
import { Alert, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../hooks/useReportDraft";
import { useSubmitReport } from "../hooks/useSubmitReport";
import { getCurrentCoords } from "../../../shared/services/locationService";

function formatLatLng(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function ReportEmergencyDetailsScreen() {
  const { draft, setDescription, setLocation, clearLocation } = useReportDraft();
  const { loading, submit } = useSubmitReport();

  const locationLabel = draft.location?.label?.trim();
  const hasLocation = Boolean(draft.location?.coords);
  const canSubmit = Boolean(draft.type && draft.location?.coords) && !loading;

  const onUseCurrentLocation = async () => {
    try {
      const coords = await getCurrentCoords();
      setLocation(coords, `Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}`);
    } catch (error: any) {
      Alert.alert("Location unavailable", error?.message ?? "Unable to get current location.");
    }
  };

  const onSubmit = async () => {
    if (!canSubmit) return;

    try {
      const response = await submit(draft);

      router.replace({
        pathname: "/report/success",
        params: {
          incidentId: response.incidentId,
          referenceNumber: response.referenceNumber,
          isSos: "0",
        },
      });
    } catch (err: any) {
      Alert.alert("Submit failed", err?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5 py-5">
      <Text className="text-sm font-medium text-zinc-500">Step 2 of 3</Text>
      <Text className="mt-2 text-2xl font-extrabold text-zinc-900">Emergency Details</Text>

      <View className="mt-6 rounded-2xl border border-zinc-200 p-4">
        <Text className="text-base font-semibold text-zinc-900">Location</Text>

        <View className="mt-3 flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/report/pick-location")}
            className="h-12 flex-1 items-center justify-center rounded-xl border border-zinc-300"
          >
            <Text className="text-base font-semibold text-zinc-700">Add location</Text>
          </Pressable>

          <Pressable
            onPress={onUseCurrentLocation}
            className="h-12 w-12 items-center justify-center rounded-md border border-zinc-300"
          >
            <Ionicons name="location" size={20} color="#334155" />
          </Pressable>
        </View>

        {hasLocation ? (
          <View className="mt-3 rounded-xl bg-zinc-100 p-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Location added</Text>
            <Text className="mt-1 text-sm text-zinc-700">
              {locationLabel ||
                `Lat: ${draft.location!.coords.latitude.toFixed(5)}, Lng: ${draft.location!.coords.longitude.toFixed(5)}`}
            </Text>

            <View className="mt-3 flex-row items-center gap-2">
              <Pressable
                onPress={() => router.push("/report/pick-location")}
                className="self-start rounded-lg border border-zinc-300 px-3 py-2"
              >
                <Text className="text-sm font-semibold text-zinc-700">Change</Text>
              </Pressable>

              <Pressable
                onPress={clearLocation}
                className="self-start rounded-lg border border-zinc-300 px-3 py-2"
              >
                <Text className="text-sm font-semibold text-zinc-700">Clear</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View className="mt-4 rounded-2xl border border-zinc-200 p-4">
        <Text className="text-base font-semibold text-zinc-900">Description (optional)</Text>
        <TextInput
          value={draft.description ?? ""}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
          placeholder="Describe what you see"
          className="mt-3 min-h-24 rounded-xl border border-zinc-300 px-3 py-3 text-zinc-900"
        />
      </View>

      <View className="mt-8 gap-3">
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          className={`h-12 items-center justify-center rounded-2xl ${
            canSubmit ? "bg-red-500" : "bg-zinc-300"
          }`}
        >
          <Text className="text-base font-semibold text-white">
            {loading ? "Submitting..." : "Submit Report"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="h-12 items-center justify-center rounded-2xl border border-zinc-300"
        >
          <Text className="text-base font-semibold text-zinc-700">Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
