import React, { useCallback } from "react";
import { Alert } from "react-native";
import { HomeView } from "../../features/home/components/HomeView";
import { useSession } from "../../features/auth/hooks/useSession";
import { useSosHold } from "../../features/emergency/hooks/useSosHold";

export default function HomeScreen() {
  const { displayName } = useSession();

  const onSosTriggered = useCallback(() => {
    // later: call emergency service here (API + location)
    Alert.alert("SOS sent", "Your alert was sent to responders.");
  }, []);

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
      onPressApplyVolunteer={() => {}}
    />
  );
}
