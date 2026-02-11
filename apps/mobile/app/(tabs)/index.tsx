import React, { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { HomeView } from "../../features/home/components/HomeView";
import { useSession } from "../../features/auth/hooks/useSession";
import { useSosHold } from "../../features/emergency/hooks/useSosHold";
import { useSosReport } from "../../features/emergency/hooks/useSosReport";
import { DispatchOfferModal } from "../../features/dispatch/components/DispatchOfferModal";
import { useActiveDispatch } from "../../features/dispatch/hooks/useActiveDispatch";
import { usePendingDispatch } from "../../features/dispatch/hooks/usePendingDispatch";
import { respondToDispatch } from "../../features/dispatch/services/dispatchApi";
import { setStoredActiveDispatch } from "../../features/dispatch/services/dispatchStorage";

export default function HomeScreen() {
  const { displayName, session } = useSession();
  const { sendSos } = useSosReport();
  const isVolunteer = useMemo(() => session?.mode === "user" && String(session.user.role ?? "").toUpperCase() === "VOLUNTEER", [session]);

  const { activeDispatch, refresh: refreshActive } = useActiveDispatch({ pollMs: 8000 });
  const { pendingDispatch, refresh: refreshPending, clear: clearPending } = usePendingDispatch({
    pollMs: 8000,
    enabled: isVolunteer && !activeDispatch,
  });

  const [dispatchBusy, setDispatchBusy] = useState(false);

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

  const onAcceptDispatch = useCallback(async () => {
    if (!pendingDispatch) return;
    try {
      setDispatchBusy(true);
      const updated = await respondToDispatch(pendingDispatch.id, "ACCEPT");
      await setStoredActiveDispatch(updated);
      clearPending();
      await refreshActive();
      router.push("/(tabs)/map");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? e?.message ?? "Unable to accept dispatch.");
    } finally {
      setDispatchBusy(false);
    }
  }, [pendingDispatch, refreshActive, clearPending]);

  const onDeclineDispatch = useCallback(async () => {
    if (!pendingDispatch) return;
    try {
      setDispatchBusy(true);
      await respondToDispatch(pendingDispatch.id, "DECLINE");
      clearPending();
      await refreshPending();
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? e?.message ?? "Unable to decline dispatch.");
    } finally {
      setDispatchBusy(false);
    }
  }, [pendingDispatch, refreshPending, clearPending]);

  return (
    <>
      <HomeView
        displayName={displayName}
        holding={holding}
        onStartHold={startHold}
        onCancelHold={cancelHold}
        onPressNotifications={() => {}}
        onPressViewAll={() => {}}
        onPressApplyVolunteer={() => router.push("/volunteer-apply-modal")}
      />

      {isVolunteer && !activeDispatch && pendingDispatch ? (
        <DispatchOfferModal
          visible
          offer={pendingDispatch}
          onAccept={onAcceptDispatch}
          onDecline={onDeclineDispatch}
          busy={dispatchBusy}
        />
      ) : null}
    </>
  );
}
