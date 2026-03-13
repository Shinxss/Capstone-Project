import React, { useCallback, useEffect, useRef } from "react";
import { Animated, BackHandler, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNav from "../../components/BottomNav";
import AuthRequiredModal from "../../components/AuthRequiredModal";
import { TASKS_GUARD_MODE } from "../../features/auth/constants/accessControl";
import { useAuthRequiredPrompt } from "../../features/auth/hooks/useAuthRequiredPrompt";
import { useSession } from "../../features/auth/hooks/useSession";
import { useTasksAccess } from "../../features/auth/hooks/useTasksAccess";
import { useReportPill } from "../../features/report/hooks/useReportPill";
import { useTheme } from "../../features/theme/useTheme";

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const authRequired = useAuthRequiredPrompt();
  const { isUser } = useSession();
  const tabBarBottomPadding = Math.max(insets.bottom, 50);
  const tabBarHeight = 64 + tabBarBottomPadding;
  const { canAccessTasks, blockReason, role } = useTasksAccess();
  const normalizedRole = String(role ?? "").trim().toUpperCase();
  const isCommunityUser = normalizedRole === "COMMUNITY";
  const { visible: reportPillVisible, hide: hideReportPill, toggle: toggleReportPill } = useReportPill();
  const reportPillAnim = useRef(new Animated.Value(0)).current;
  const lastBackPressAtRef = useRef(0);

  useEffect(() => {
    Animated.timing(reportPillAnim, {
      toValue: reportPillVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [reportPillAnim, reportPillVisible]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBackPress = () => {
      if (reportPillVisible) {
        hideReportPill();
        return true;
      }

      const isTabsRoot = pathname === "/" || pathname === "/(tabs)";
      if (!isTabsRoot) {
        router.replace("/(tabs)");
        return true;
      }

      const now = Date.now();
      if (now - lastBackPressAtRef.current < 2000) {
        return false;
      }

      lastBackPressAtRef.current = now;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);

    return () => {
      subscription.remove();
    };
  }, [hideReportPill, pathname, reportPillVisible, router]);

  const onPressReportPill = useCallback(() => {
    hideReportPill();
    if (!authRequired.requireAuth(isUser, { blockedAction: "report_emergency" })) return;
    router.push("/report");
  }, [authRequired, hideReportPill, isUser, router]);

  const onPressReportAction = useCallback(() => {
    if (!authRequired.requireAuth(isUser, { blockedAction: "report_emergency" })) {
      hideReportPill();
      return;
    }

    toggleReportPill();
  }, [authRequired, hideReportPill, isUser, toggleReportPill]);

  const onProtectedTabPress = useCallback(
    (e: { preventDefault: () => void }) => {
      if (isCommunityUser || canAccessTasks) return;

      e.preventDefault();

      if (blockReason === "role") {
        router.push("/volunteer-apply-modal");
        return;
      }

      if (TASKS_GUARD_MODE === "redirect") {
        void authRequired.goToLogin();
        return;
      }

      authRequired.openAuthRequired({ blockedAction: "access_volunteer_tools" });
    },
    [authRequired, blockReason, canAccessTasks, isCommunityUser, router]
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "shift",
        }}
        tabBar={(props) => (
          <BottomNav
            {...props}
            onPressRegularTab={hideReportPill}
            onPressReportAction={onPressReportAction}
          />
        )}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="map" />
        <Tabs.Screen
          name="tasks"
          listeners={{
            tabPress: onProtectedTabPress,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "Profile",
          }}
        />
      </Tabs>

      {reportPillVisible ? (
        <Animated.View
          pointerEvents="auto"
          style={[styles.blurOverlay, { bottom: tabBarHeight, opacity: reportPillAnim }]}
        >
          <BlurView intensity={72} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: isDark ? "rgba(6,12,24,0.66)" : "rgba(255,255,255,0.70)" },
            ]}
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
        {...authRequired.modalProps}
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
