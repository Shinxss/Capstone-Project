import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../hooks/useReportDraft";

type SearchParams = {
  incidentId?: string;
  referenceNumber?: string;
  isSos?: string;
};

export function ReportEmergencySuccessScreen() {
  const { incidentId, referenceNumber, isSos } = useLocalSearchParams<SearchParams>();
  const { reset } = useReportDraft();
  const sosMode = String(isSos ?? "") === "1";

  const onBackHome = () => {
    reset();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle-outline" size={44} color="#16a34a" />
        </View>
      </View>

      <Text allowFontScaling={false} style={styles.title}>
        {sosMode ? "SOS Sent!" : "Report Submitted!"}
      </Text>

      <Text allowFontScaling={false} style={styles.message}>
        {sosMode
          ? "Your SOS has been received. Responders in your area have been alerted."
          : "Your emergency report has been received. Responders in your area have been alerted."}
      </Text>

      <View style={styles.referenceCard}>
        <Text allowFontScaling={false} style={styles.referenceLabel}>
          Reference Number:
        </Text>
        <Text allowFontScaling={false} style={styles.referenceValue}>
          {referenceNumber || "N/A"}
        </Text>
      </View>

      <Text allowFontScaling={false} style={styles.helperText}>
        Keep this reference number for tracking. You will receive updates about your report.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/map",
              params: incidentId ? { incidentId } : undefined,
            })
          }
          style={styles.primaryBtn}
        >
          <Text allowFontScaling={false} style={styles.primaryBtnText}>
            View on Map
          </Text>
        </Pressable>

        <Pressable onPress={onBackHome} style={styles.secondaryBtn}>
          <Text allowFontScaling={false} style={styles.secondaryBtnText}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
  },
  iconWrap: {
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d1fae5",
  },
  title: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 42 / 2,
    fontWeight: "600",
    color: "#18181b",
  },
  message: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 25,
    color: "#52525b",
    paddingHorizontal: 30,
  },
  referenceCard: {
    marginTop: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  referenceLabel: {
    fontSize: 17,
    color: "#52525b",
  },
  referenceValue: {
    marginTop: 12,
    fontSize: 38 / 2,
    fontWeight: "700",
    color: "#18181b",
  },
  helperText: {
    marginTop: 26,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 25,
    color: "#52525b",
    paddingHorizontal: 24,
  },
  actions: {
    marginTop: 28,
    gap: 14,
  },
  primaryBtn: {
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  secondaryBtn: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  secondaryBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#18181b",
  },
});

