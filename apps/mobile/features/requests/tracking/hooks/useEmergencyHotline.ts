import { useCallback } from "react";
import { Alert, Linking } from "react-native";
import { EMERGENCY_HOTLINE } from "../constants/tracking.constants";

export function useEmergencyHotline() {
  const callEmergencyHotline = useCallback(() => {
    Alert.alert("Call Emergency Hotline?", `Open your phone dialer with ${EMERGENCY_HOTLINE}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Open Dialer", style: "destructive", onPress: () => { void (async () => { const url = `tel:${EMERGENCY_HOTLINE}`; if (!(await Linking.canOpenURL(url))) { Alert.alert("Call unavailable", "Your device cannot open the phone dialer."); return; } await Linking.openURL(url); })(); } },
    ]);
  }, []);
  return { emergencyHotline: EMERGENCY_HOTLINE, callEmergencyHotline };
}
