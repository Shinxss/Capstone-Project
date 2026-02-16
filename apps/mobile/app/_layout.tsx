import "react-native-gesture-handler";
import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as WebBrowser from "expo-web-browser";
import "../global.css";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />

        {/* ✅ Volunteer modal */}
        <Stack.Screen
          name="volunteer-apply-modal"
          options={{ presentation: "transparentModal" }}
        />

        {/* ✅ Volunteer application form */}
        <Stack.Screen name="volunteer-application" />

        {/* keep your existing modal if you still use it */}
        <Stack.Screen name="modal" />
        <Stack.Screen name="set-password" />
      </Stack>
    </GestureHandlerRootView>
  );
}
