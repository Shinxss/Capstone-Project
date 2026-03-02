import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Stack, router, useGlobalSearchParams, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  const params = useGlobalSearchParams<{ isSos?: string }>();
  const routeKey = getReportRouteKey(segments);
  const showHeader =
    routeKey === "index" || routeKey === "details" || routeKey === "confirm" || routeKey === "success";
  const currentStep = getStepFromRoute(routeKey);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateX = useRef(new Animated.Value(24)).current;
  const toastTitle = String(params.isSos ?? "") === "1" ? "Emergency SOS sent!" : "Emergency report sent!";

  useEffect(() => {
    if (routeKey !== "success") {
      setShowSuccessToast(false);
      return;
    }

    setShowSuccessToast(true);
    toastOpacity.setValue(0);
    toastTranslateX.setValue(24);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateX, {
          toValue: 16,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShowSuccessToast(false);
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [routeKey, toastOpacity, toastTranslateX]);

  return (
    <ReportDraftProvider>
      <View className="flex-1 bg-zinc-100">
        {showHeader ? (
          <SafeAreaView edges={["top"]} className="bg-zinc-100">
            <ReportEmergencyHeader step={currentStep} totalSteps={3} onBack={() => router.back()} />
          </SafeAreaView>
        ) : null}

        {routeKey === "success" && showSuccessToast ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.successToast,
              {
                opacity: toastOpacity,
                transform: [{ translateX: toastTranslateX }],
              },
            ]}
          >
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.successCopy}>
              <Text style={styles.successTitle}>{toastTitle}</Text>
              <Text style={styles.successSub}>
                Help is on the way. Stay calm and stay where you are.
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
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

const styles = StyleSheet.create({
  successToast: {
    position: "absolute",
    right: 12,
    top: 50,
    zIndex: 300,
    width: "66%",
    maxWidth: 320,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  successIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  successCopy: {
    flex: 1,
    marginLeft: 8,
  },
  successTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#14532D",
  },
  successSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#166534",
  },
});
