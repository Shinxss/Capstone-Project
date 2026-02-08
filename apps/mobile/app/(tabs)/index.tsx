import React, { useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { HomeView } from "../../features/home/components/HomeView";
import { useSession } from "../../features/auth/hooks/useSession";
import { useSosHold } from "../../features/emergency/hooks/useSosHold";
import { useSosReport } from "../../features/emergency/hooks/useSosReport";

export default function HomeScreen() {
  const { displayName } = useSession();
  const { sendSos } = useSosReport();

  const onSosTriggered = useCallback(async () => {
    try {
      await sendSos();
      Alert.alert("SOS sent", "Your alert was sent to responders.");
    } catch (e: any) {
      Alert.alert("SOS failed", e?.message ?? "Please try again.");
    }
  }, [sendSos]);

  const { holding, startHold, cancelHold } = useSosHold({
    holdMs: 3000,
    onTriggered: onSosTriggered,
  });

  return (
    <HomeView
      displayName={displayName}
      holding={holding}
      onStartHold={startHold}
      onCancelHold={cancelHold}
      onPressNotifications={() => {}}
      onPressViewAll={() => {}}
      onPressApplyVolunteer={() => router.push("/volunteer-apply-modal")}
    />
  );
}
