import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useReportDraft } from "../hooks/useReportDraft";

type SearchParams = {
  incidentId?: string;
  referenceNumber?: string;
  clientRequestId?: string;
  deliveryMode?: string;
  isSos?: string;
  reportLng?: string;
  reportLat?: string;
};

export function ReportEmergencySuccessScreen() {
  const {
    incidentId,
    referenceNumber,
    clientRequestId,
    deliveryMode,
    isSos,
    reportLng,
    reportLat,
  } = useLocalSearchParams<SearchParams>();
  const { reset } = useReportDraft();

  const sosMode = String(isSos ?? "") === "1";
  const mode = (deliveryMode as "online" | "offline_sms" | "offline_queued") || "online";
  const isOfflineSms = mode === "offline_sms";
  const isOfflineQueued = mode === "offline_queued";
  const isOfflineMode = isOfflineSms || isOfflineQueued;

  const viewOnMapParams: Record<string, string> = {};
  if (incidentId && !isOfflineMode) viewOnMapParams.incidentId = String(incidentId);
  if (reportLng) viewOnMapParams.reportLng = String(reportLng);
  if (reportLat) viewOnMapParams.reportLat = String(reportLat);

  const onBackHome = () => {
    reset();
    router.replace("/(tabs)");
  };

  // Determine title based on delivery mode
  let title = sosMode ? "SOS Sent!" : "Report Submitted!";
  if (isOfflineSms) {
    title = sosMode ? "SOS Saved & Prepared" : "Report Saved & Prepared";
  } else if (isOfflineQueued) {
    title = sosMode ? "SOS Saved Offline" : "Report Saved Offline";
  }

  // Determine message based on delivery mode
  let message = sosMode
    ? "Your SOS has been received. Responders in your area have been alerted."
    : "Your emergency report has been received. Responders in your area have been alerted.";
  if (isOfflineSms) {
    message =
      "Your emergency has been saved on this device. Lifeline opened your SMS app with the emergency details. Delivery cannot be confirmed from the app. The report will also sync to Lifeline when internet returns.";
  } else if (isOfflineQueued) {
    message =
      "Your emergency has been saved on this device and is waiting to sync. Try SMS again if available, or reconnect to the internet.";
  }

  const displayedReference = clientRequestId || referenceNumber || "N/A";

  return (
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.iconWrap}>
          <View
            style={[
              styles.iconCircle,
              isOfflineSms && styles.iconCircleSms,
              isOfflineQueued && styles.iconCircleQueued,
            ]}
          >
            {isOfflineQueued ? (
              <Ionicons name="cloud-offline-outline" size={44} color="#b45309" />
            ) : isOfflineSms ? (
              <Ionicons name="chatbox-ellipses-outline" size={44} color="#0284c7" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={44} color="#16a34a" />
            )}
          </View>
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.title}>
          {title}
        </Text>

        <Text maxFontSizeMultiplier={1.3} style={styles.message}>
          {message}
        </Text>

        <View style={styles.referenceCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.referenceLabel}>
            {isOfflineMode ? "Local Reference ID:" : "Reference Number:"}
          </Text>
          <Text maxFontSizeMultiplier={1.2} numberOfLines={2} style={styles.referenceValue}>
            {displayedReference}
          </Text>
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.helperText}>
          {isOfflineMode
            ? "Keep this reference ID. Your emergency is queued on this device and will automatically sync when connectivity is restored."
            : "Keep this reference number for tracking. You will receive updates about your report."}
        </Text>

        <View style={styles.actions}>
          {!isOfflineMode ? (
            <>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/map",
                    params: Object.keys(viewOnMapParams).length ? viewOnMapParams : undefined,
                  })
                }
                style={styles.primaryBtn}
              >
                <Text maxFontSizeMultiplier={1.2} style={styles.primaryBtnText}>
                  View on Map
                </Text>
              </Pressable>

              <Pressable onPress={onBackHome} style={styles.secondaryBtn}>
                <Text maxFontSizeMultiplier={1.2} style={styles.secondaryBtnText}>
                  Back to Home
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={onBackHome} style={styles.primaryBtn}>
              <Text maxFontSizeMultiplier={1.2} style={styles.primaryBtnText}>
                Back to Home
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  content: {
    flexGrow: 1,
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
  iconCircleSms: {
    backgroundColor: "#e0f2fe",
  },
  iconCircleQueued: {
    backgroundColor: "#fef3c7",
  },
  title: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "600",
    color: "#18181b",
  },
  message: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: "#52525b",
    paddingHorizontal: 16,
  },
  referenceCard: {
    marginTop: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  referenceLabel: {
    fontSize: 15,
    color: "#52525b",
  },
  referenceValue: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: "700",
    color: "#18181b",
  },
  helperText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    color: "#52525b",
    paddingHorizontal: 20,
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
