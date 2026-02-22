import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import AuthRequiredModal from "../../components/AuthRequiredModal";
import { TASKS_GUARD_MODE } from "../../features/auth/constants/accessControl";
import { useTasksAccess } from "../../features/auth/hooks/useTasksAccess";
import { useAuth } from "../../features/auth/AuthProvider";
import { useReportPill } from "../../features/report/hooks/useReportPill";

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { canAccessTasks, blockReason, role } = useTasksAccess();
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const { visible: reportPillVisible, hide: hideReportPill, toggle: toggleReportPill } = useReportPill();
  const reportPillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reportPillAnim, {
      toValue: reportPillVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [reportPillAnim, reportPillVisible]);

  const onPressReportPill = useCallback(() => {
    hideReportPill();
    router.push("/report");
  }, [hideReportPill, router]);

  const goLogin = useCallback(async () => {
    setShowAuthRequired(false);
    await signOut();
    router.replace("/(auth)/login");
  }, [router, signOut]);

  const onProtectedTabPress = useCallback(
    (e: { preventDefault: () => void }) => {
      if (canAccessTasks) return;

      e.preventDefault();

      if (blockReason === "role" && String(role ?? "").trim().toUpperCase() === "COMMUNITY") {
        router.push("/volunteer-apply-modal");
        return;
      }

      if (TASKS_GUARD_MODE === "redirect") {
        void goLogin();
        return;
      }

      setShowAuthRequired(true);
    },
    [blockReason, canAccessTasks, goLogin, role, router]
  );

  const modalTitle = blockReason === "role" ? "Access Restricted" : "Login Required";
  const modalMessage =
    blockReason === "role"
      ? "Your account role does not have permission to access Tasks."
      : "You need to log in to access Tasks.";

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <BottomNav
            {...props}
            onPressRegularTab={hideReportPill}
            onPressReportAction={toggleReportPill}
          />
        )}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="map" />
        <Tabs.Screen
          name="alert"
          listeners={{
            tabPress: onProtectedTabPress,
          }}
        />
        <Tabs.Screen name="more" />
      </Tabs>

      {reportPillVisible ? (
        <Pressable
          className="absolute left-0 right-0 top-0"
          style={{ bottom: Math.max(90, 74 + insets.bottom) }}
          onPress={hideReportPill}
        />
      ) : null}

      <Animated.View
        pointerEvents={reportPillVisible ? "auto" : "none"}
        className="absolute left-0 right-0 items-center"
        style={{
          bottom: 72 + insets.bottom,
          opacity: reportPillAnim,
          transform: [
            {
              translateY: reportPillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPress={onPressReportPill}
          className="flex-row items-center rounded-full bg-red-500 px-5 py-3 shadow"
        >
          <AlertTriangle size={18} className="text-white" />
          <Text className="ml-2 text-base font-semibold text-white">Report Emergency</Text>
        </Pressable>
      </Animated.View>

      <AuthRequiredModal
        visible={showAuthRequired}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowAuthRequired(false)}
        onLogin={goLogin}
      />
    </>
  );
}
