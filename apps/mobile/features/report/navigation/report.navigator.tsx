import React from "react";
import { Stack } from "expo-router";
import { ReportDraftProvider } from "../hooks/useReportDraft";

export function ReportNavigator() {
  return (
    <ReportDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="details" />
        <Stack.Screen name="pick-location" />
        <Stack.Screen name="success" />
      </Stack>
    </ReportDraftProvider>
  );
}
