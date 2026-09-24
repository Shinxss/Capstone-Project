import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConnectivity } from "../../connectivity/hooks/useConnectivity";

export function OfflineBanner() {
  const { isOffline } = useConnectivity();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) + 4 }]}>
      <View style={styles.bannerContent}>
        <Ionicons name="cloud-offline-outline" size={16} color="#ffffff" style={styles.icon} />
        <Text style={styles.text} numberOfLines={2}>
          You&apos;re offline. SOS and emergency reports can still be saved and sent by SMS.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#b45309", // Warm amber/orange
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 999,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
});
