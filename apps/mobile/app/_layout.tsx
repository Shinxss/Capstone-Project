import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as WebBrowser from "expo-web-browser";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import SplashScreen from "../screens/SplashScreen";
import "../global.css";

WebBrowser.maybeCompleteAuthSession();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { hydrated, mode } = useAuth();

  const inAuthGroup = segments[0] === "(auth)";
  const inTabsGroup = segments[0] === "(tabs)";
  const inVolunteerFlow =
    segments[0] === "volunteer-apply-modal" ||
    segments[0] === "volunteer-application";

  useEffect(() => {
    if (!hydrated) return;

    if ((mode === "authed" || mode === "guest") && !inTabsGroup && !inVolunteerFlow) {
      router.replace("/(tabs)");
      return;
    }

    if (mode === "anonymous" && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [hydrated, mode, inAuthGroup, inTabsGroup, inVolunteerFlow, router]);

  if (!hydrated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="volunteer-apply-modal"
              options={{ presentation: "transparentModal" }}
            />
            <Stack.Screen name="volunteer-application" />
            <Stack.Screen name="modal" />
            <Stack.Screen name="set-password" />
          </Stack>
        </AuthGate>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
