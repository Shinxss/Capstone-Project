import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
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
import { api } from "../../lib/api";

export default function HomeScreen() {
  const { displayName, session } = useSession();
  const { sendSos } = useSosReport();
  const isVolunteer = useMemo(() => session?.mode === "user" && String(session.user.role ?? "").toUpperCase() === "VOLUNTEER", [session]);

  const { refresh: refreshActive } = useActiveDispatch({ pollMs: 8000 });
  const { pendingDispatch, refresh: refreshPending, clear: clearPending } = usePendingDispatch({
    pollMs: 8000,
    enabled: isVolunteer,
  });

  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [pushDebugBusy, setPushDebugBusy] = useState(false);

  const onSosTriggered = useCallback(async () => {
    try {
      const result = await sendSos();
      router.push({
        pathname: "/report/success",
        params: {
          incidentId: result.incidentId,
          referenceNumber: result.referenceNumber,
          isSos: "1",
        },
      });
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

  const onDebugCheckToken = useCallback(async () => {
    try {
      setPushDebugBusy(true);
      const res = await api.get<{
        count: number;
        activeCount: number;
        tokens: { expoPushToken: string; isActive: boolean }[];
      }>("/api/notifications/push-token/me");

      const payload = res.data;
      const firstToken = payload.tokens?.[0]?.expoPushToken;
      const tokenPreview = firstToken
        ? `${firstToken.slice(0, 18)}...${firstToken.slice(-8)}`
        : "none";

      Alert.alert(
        "Push Token Status",
        `active=${payload.activeCount}, total=${payload.count}, first=${tokenPreview}`
      );
    } catch (e: any) {
      Alert.alert(
        "Push Debug Failed",
        e?.response?.data?.message ?? e?.message ?? "Unable to check token status."
      );
    } finally {
      setPushDebugBusy(false);
    }
  }, []);

  const onDebugSendTest = useCallback(async () => {
    try {
      setPushDebugBusy(true);
      const res = await api.post<{ attempted: number; sent: number; errors?: string[] }>(
        "/api/notifications/push-test/me"
      );
      const errors = res.data.errors ?? [];
      Alert.alert(
        "Push Test",
        `attempted=${res.data.attempted}, sent=${res.data.sent}${errors.length ? `\nerror=${errors[0]}` : ""}`
      );
    } catch (e: any) {
      Alert.alert(
        "Push Debug Failed",
        e?.response?.data?.message ?? e?.message ?? "Unable to send test push."
      );
    } finally {
      setPushDebugBusy(false);
    }
  }, []);

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

      {isVolunteer && pendingDispatch?.status === "PENDING" ? (
        <DispatchOfferModal
          visible
          offer={pendingDispatch}
          onAccept={onAcceptDispatch}
          onDecline={onDeclineDispatch}
          busy={dispatchBusy}
        />
      ) : null}

      {__DEV__ && session?.mode === "user" ? (
        <View className="absolute right-3 top-24 rounded-xl border border-zinc-300 bg-white/95 p-2">
          <Text className="mb-1 text-[11px] font-semibold text-zinc-700">Push Debug</Text>
          <Pressable
            disabled={pushDebugBusy}
            onPress={onDebugCheckToken}
            className="mb-1 rounded-md border border-zinc-300 px-2 py-1"
          >
            <Text className="text-xs font-semibold text-zinc-800">Check token</Text>
          </Pressable>
          <Pressable
            disabled={pushDebugBusy}
            onPress={onDebugSendTest}
            className="rounded-md bg-red-500 px-2 py-1"
          >
            <Text className="text-xs font-semibold text-white">Send test</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
