import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { ThemeProvider } from "../features/theme/ThemeProvider";
import { useTheme } from "../features/theme/useTheme";
import { InAppNotificationHost } from "../features/notifications/components/InAppNotificationHost";
import { usePushNotificationsBootstrap } from "../features/notifications/hooks/usePushNotificationsBootstrap";
import { useRealtimeBootstrap } from "../features/realtime/hooks/useRealtimeBootstrap";
import SplashScreen from "../screens/SplashScreen";
import "../global.css";

WebBrowser.maybeCompleteAuthSession();

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { hydrated, mode } = useAuth();
  usePushNotificationsBootstrap();
  useRealtimeBootstrap();

  const inAuthGroup = segments[0] === "(auth)";
  const inTabsGroup = segments[0] === "(tabs)";
  const inReportFlow = segments[0] === "report";
  const inVolunteerFlow =
    segments[0] === "volunteer-apply-modal" ||
    segments[0] === "volunteer-application";
  const inMyRequestsFlow =
    segments[0] === "my-requests" ||
    segments[0] === "my-request-tracking";

  useEffect(() => {
    if (!hydrated) return;

    if (
      (mode === "authed" || mode === "guest") &&
      !inTabsGroup &&
      !inVolunteerFlow &&
      !inReportFlow &&
      !inMyRequestsFlow
    ) {
      router.replace("/(tabs)");
      return;
    }

    if (mode === "anonymous" && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [hydrated, mode, inAuthGroup, inTabsGroup, inVolunteerFlow, inReportFlow, inMyRequestsFlow, router]);

  if (!hydrated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

function RootLayoutInner() {
  const { isDark } = useTheme();

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <AuthGate>
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="report" />
              <Stack.Screen name="my-requests" />
              <Stack.Screen name="my-request-tracking" />
              <Stack.Screen
                name="volunteer-apply-modal"
                options={{ presentation: "transparentModal" }}
              />
              <Stack.Screen name="volunteer-application" />
              <Stack.Screen name="modal" />
              <Stack.Screen name="set-password" />
            </Stack>
            <InAppNotificationHost />
          </>
        </AuthGate>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
