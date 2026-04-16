import React from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { ThemeProvider } from "../features/theme/ThemeProvider";
import { useTheme } from "../features/theme/useTheme";
import { InAppNotificationHost } from "../features/notifications/components/InAppNotificationHost";
import { usePushNotificationsBootstrap } from "../features/notifications/hooks/usePushNotificationsBootstrap";
import { useNotificationsBootstrap } from "../features/notifications/hooks/useNotificationsBootstrap";
import { useRealtimeBootstrap } from "../features/realtime/hooks/useRealtimeBootstrap";
import SplashScreen from "../screens/SplashScreen";
import "../global.css";

WebBrowser.maybeCompleteAuthSession();

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrated, mode, user } = useAuth();
  usePushNotificationsBootstrap();
  useNotificationsBootstrap();
  useRealtimeBootstrap();

  const currentPath = String(pathname ?? "");
  const inAuthFlow =
    currentPath.startsWith("/(auth)") ||
    currentPath === "/login" ||
    currentPath === "/signup" ||
    currentPath === "/forgot-password" ||
    currentPath === "/otp-verification" ||
    currentPath === "/reset-password";
  const inProfileCompletionFlow = currentPath === "/profile-completion";
  const inSetPasswordFlow = currentPath === "/set-password";

  const profileCompletionRequired = mode === "authed" && user?.profileCompletionRequired === true;

  if (!hydrated) {
    return <SplashScreen />;
  }

  if (mode === "anonymous" && !inAuthFlow) {
    return <Redirect href="/(auth)/login" />;
  }

  if (mode === "guest" && inAuthFlow) {
    return <Redirect href="/(tabs)" />;
  }

  if (mode === "authed") {
    if (profileCompletionRequired && !inProfileCompletionFlow && !inSetPasswordFlow) {
      return <Redirect href="/profile-completion" />;
    }

    if (!profileCompletionRequired && inProfileCompletionFlow) {
      return <Redirect href="/(tabs)" />;
    }

    if (!profileCompletionRequired && inAuthFlow) {
      return <Redirect href="/(tabs)" />;
    }
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
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_left",
                animationDuration: 420,
                animationTypeForReplace: "push",
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            >
              <Stack.Screen
                name="(auth)"
                options={{
                  animation: "none",
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="report" />
              <Stack.Screen name="my-requests" />
              <Stack.Screen name="my-request-tracking" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="profile/skills" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="profile-completion" />
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
