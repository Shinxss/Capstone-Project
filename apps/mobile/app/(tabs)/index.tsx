import React, { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { HomeView } from "../../features/home/components/HomeView";
import { useSession } from "../../features/auth/hooks/useSession";
import { useSosHold } from "../../features/emergency/hooks/useSosHold";
import { useSosReport } from "../../features/emergency/hooks/useSosReport";
import { usePendingDispatch } from "../../features/dispatch/hooks/usePendingDispatch";
import { respondToDispatch } from "../../features/dispatch/services/dispatchApi";
import { useActiveDispatch } from "../../features/dispatch/hooks/useActiveDispatch";
import { DispatchOfferModal } from "../../features/dispatch/components/DispatchOfferModal";

export default function HomeScreen() {
  const { session, displayName, isUser } = useSession();
  const { sendSos } = useSosReport();

  const role = (isUser && session?.mode === "user" ? session.user.role : undefined) as string | undefined;
  const isVolunteer = role === "VOLUNTEER";

  const { active: activeDispatch, set: setActiveDispatch } = useActiveDispatch();
  const hasActive = useMemo(() => !!activeDispatch && activeDispatch.status === "ACCEPTED", [activeDispatch]);

  const { pending, clear: clearPending } = usePendingDispatch({
    enabled: isVolunteer && !hasActive,
    pollMs: 4000,
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

  const acceptDispatch = useCallback(async () => {
    if (!pending) return;
    if (dispatchBusy) return;

    setDispatchBusy(true);
    try {
      const updated = await respondToDispatch(pending.id, "ACCEPT");
      await setActiveDispatch(updated);
      clearPending();
      router.push("/map");
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? e?.message ?? "Unable to accept dispatch.");
    } finally {
      setDispatchBusy(false);
    }
  }, [pending, dispatchBusy, setActiveDispatch, clearPending]);

  const declineDispatch = useCallback(async () => {
    if (!pending) return;
    if (dispatchBusy) return;

    setDispatchBusy(true);
    try {
      await respondToDispatch(pending.id, "DECLINE");
      clearPending();
    } catch (e: any) {
      Alert.alert("Failed", e?.response?.data?.message ?? e?.message ?? "Unable to decline dispatch.");
    } finally {
      setDispatchBusy(false);
    }
  }, [pending, dispatchBusy, clearPending]);

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

      {pending ? (
        <DispatchOfferModal
          visible={!!pending}
          offer={pending}
          loading={dispatchBusy}
          onAccept={acceptDispatch}
          onDecline={declineDispatch}
          onClose={clearPending}
        />
      ) : null}
    </>
  );
}
