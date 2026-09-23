import { useCallback } from "react";
import { Alert, Linking } from "react-native";
import { EMERGENCY_HOTLINE } from "../constants/tracking.constants";

export function useEmergencyHotline() {
  const openEmergencyDialer = useCallback(async () => {
    const hotline = EMERGENCY_HOTLINE.trim();
    if (!hotline) {
      Alert.alert(
        "Call unavailable",
        "We couldn't open your phone dialer. Please call 911 manually."
      );
      return;
    }

    const url = `tel:${hotline}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("[emergency-hotline] unable to open dialer", error);
      Alert.alert(
        "Call unavailable",
        `We couldn't open your phone dialer. Please call ${hotline} manually.`
      );
    }
  }, []);

  const callEmergencyHotline = useCallback(() => {
    const hotline = EMERGENCY_HOTLINE.trim() || "911";
    Alert.alert(
      "Call Emergency Hotline?",
      `Open your phone dialer with ${hotline}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Dialer",
          style: "destructive",
          onPress: () => {
            void openEmergencyDialer();
          },
        },
      ]
    );
  }, [openEmergencyDialer]);

  return { emergencyHotline: EMERGENCY_HOTLINE, callEmergencyHotline };
}
