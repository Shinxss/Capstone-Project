import React from "react";
import { View } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReportDraftProvider } from "../hooks/useReportDraft";
import { ReportEmergencyHeader } from "../components/ReportEmergencyHeader";

function getReportRouteKey(segments: string[]) {
  const last = segments[segments.length - 1];
  if (!last || last === "report") return "index";
  return last;
}

function getStepFromRoute(routeKey: string) {
  if (routeKey === "details") return 2;
  if (routeKey === "success") return 3;
  if (routeKey === "confirm") return 3;
  return 1;
}

export function ReportNavigator() {
  const segments = useSegments();
  const routeKey = getReportRouteKey(segments);
  const showHeader =
    routeKey === "index" || routeKey === "details" || routeKey === "confirm" || routeKey === "success";
  const currentStep = getStepFromRoute(routeKey);
  return (
    <ReportDraftProvider>
      <View className="flex-1 bg-zinc-100">
        {showHeader ? (
          <SafeAreaView edges={["top"]} className="bg-zinc-100">
            <ReportEmergencyHeader step={currentStep} totalSteps={3} onBack={() => router.back()} />
          </SafeAreaView>
        ) : null}

        <View className="flex-1">
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_left",
              animationDuration: 320,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="details" />
            <Stack.Screen name="pick-location" />
            <Stack.Screen name="success" />
          </Stack>
        </View>
      </View>
    </ReportDraftProvider>
  );
}
