import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { BlurView } from "expo-blur";
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
  const tabBarBottomPadding = Math.max(insets.bottom, 50);
  const tabBarHeight = 64 + tabBarBottomPadding;
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
        <Animated.View
          pointerEvents="auto"
          style={[styles.blurOverlay, { bottom: tabBarHeight, opacity: reportPillAnim }]}
        >
          <BlurView intensity={72} tint="light" style={StyleSheet.absoluteFillObject} />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.70)" }]}
          />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={hideReportPill} />
        </Animated.View>
      ) : null}

      <Animated.View
        pointerEvents={reportPillVisible ? "auto" : "none"}
        style={[styles.reportPillWrap, {
          bottom: tabBarHeight + 24,
          opacity: reportPillAnim,
          transform: [
            {
              translateY: reportPillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }]}
      >
        <Pressable
          onPress={onPressReportPill}
          style={({ pressed }) => [styles.reportPill, pressed && styles.reportPillPressed]}
        >
          <AlertTriangle size={22} color="#FFFFFF" />
          <Text style={styles.reportPillText}>
            Report Emergency
          </Text>
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

const styles = StyleSheet.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  reportPillWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 30,
  },
  reportPill: {
    width: 286,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  reportPillPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  reportPillText: {
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
