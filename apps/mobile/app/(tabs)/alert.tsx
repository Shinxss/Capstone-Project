import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import type { DispatchOffer } from "../../features/dispatch/models/dispatch";
import { completeDispatch, fetchMyCurrentDispatch, uploadDispatchProof } from "../../features/dispatch/services/dispatchApi";
import { useTasksAccess } from "../../features/auth/hooks/useTasksAccess";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";
// Backend must still enforce auth + role checks on Tasks APIs (return 401/403 as needed).

function absUrl(relative: string) {
  if (!relative) return relative;
  if (relative.startsWith("http")) return relative;
  return `${API_BASE}${relative}`;
}

function pill(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "ACCEPTED") return "In Progress";
  if (s === "DONE") return "For Review";
  if (s === "VERIFIED") return "Verified";
  return s || "—";
}

export default function TasksScreen() {
  const router = useRouter();
  const { hydrated, canAccessTasks } = useTasksAccess();
  const [task, setTask] = useState<DispatchOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const hasTask = !!task;
  const proofs = useMemo(() => (task?.proofs ?? []).slice().reverse(), [task]);

  const refresh = useCallback(async () => {
    if (!canAccessTasks) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const current = await fetchMyCurrentDispatch();
      setTask(current);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [canAccessTasks]);

  useEffect(() => {
    if (!hydrated) return;
    if (!canAccessTasks) {
      router.replace("/(auth)/login");
      return;
    }

    refresh();
  }, [canAccessTasks, hydrated, refresh, router]);

  const pickAndUpload = useCallback(async () => {
    if (!canAccessTasks) return;
    if (!task) return;
    try {
      setBusy(true);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow access to your photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.base64) {
        Alert.alert("Upload failed", "Unable to read image data. Try again.");
        return;
      }

      const updated = await uploadDispatchProof(task.id, {
        base64: asset.base64,
        mimeType: (asset as any).mimeType ?? undefined,
        fileName: (asset as any).fileName ?? "proof.jpg",
      });

      setTask(updated);
      Alert.alert("Uploaded", "Proof uploaded successfully.");
    } catch (e: any) {
      Alert.alert("Upload failed", e?.response?.data?.message ?? e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, [canAccessTasks, task]);

  const markDone = useCallback(async () => {
    if (!canAccessTasks) return;
    if (!task) return;

    Alert.alert(
      "Mark as done?",
      "Make sure you uploaded proof before marking this task as done.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Done",
          style: "default",
          onPress: async () => {
            try {
              setBusy(true);
              const updated = await completeDispatch(task.id);
              setTask(updated);
              Alert.alert("Submitted", "Task marked as done. Waiting for LGU verification.");
            } catch (e: any) {
              Alert.alert("Failed", e?.response?.data?.message ?? e?.message ?? "Something went wrong");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [canAccessTasks, task]);

  if (!hydrated || !canAccessTasks) return null;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">Tasks</Text>
          <Text className="text-gray-500 text-sm">Your assigned / dispatched emergency</Text>
        </View>

        <Pressable
          onPress={refresh}
          disabled={loading || busy}
          className="px-3 py-2 rounded-xl bg-white border border-gray-200"
        >
          <Text className="text-gray-800 font-semibold">Refresh</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6 }}>
        {loading ? (
          <View className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="text-gray-600">Loading…</Text>
          </View>
        ) : !hasTask ? (
          <View className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="text-gray-800 font-semibold">No task right now</Text>
            <Text className="text-gray-500 mt-1 text-sm">Wait for an LGU dispatch to accept.</Text>
          </View>
        ) : (
          <>
            <View className="bg-white border border-gray-200 rounded-2xl p-4">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-gray-900 text-lg font-extrabold">
                    {String(task.emergency.emergencyType).toUpperCase()} Emergency
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {task.emergency.barangayName ? `Barangay: ${task.emergency.barangayName}` : "Barangay: —"}
                  </Text>
                </View>

                <View className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                  <Text className="text-blue-700 text-xs font-extrabold">{pill(task.status)}</Text>
                </View>
              </View>

              {task.emergency.notes ? (
                <Text className="text-gray-700 mt-3">{task.emergency.notes}</Text>
              ) : null}

              <Text className="text-gray-500 text-xs mt-3">
                Location: {task.emergency.lat.toFixed(5)}, {task.emergency.lng.toFixed(5)}
              </Text>

              <View className="flex-row gap-3 mt-4">
                <Pressable
                  onPress={pickAndUpload}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-white border border-gray-200 px-4 py-3"
                >
                  <Text className="text-gray-900 font-extrabold text-center">
                    {busy ? "Working…" : "Upload Proof"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={markDone}
                  disabled={busy || task.status !== "ACCEPTED"}
                  className={`flex-1 rounded-xl px-4 py-3 ${task.status === "ACCEPTED" ? "bg-emerald-600" : "bg-emerald-200"}`}
                >
                  <Text className="text-white font-extrabold text-center">Mark as Done</Text>
                </Pressable>
              </View>

              {task.status === "DONE" ? (
                <Text className="text-amber-700 mt-3 text-xs font-semibold">
                  Waiting for LGU review/verification.
                </Text>
              ) : null}
            </View>

            <View className="mt-4">
              <Text className="text-gray-700 text-sm font-extrabold">Proof Uploads</Text>

              {proofs.length === 0 ? (
                <View className="mt-2 bg-white border border-gray-200 rounded-2xl p-4">
                  <Text className="text-gray-500 text-sm">No proof uploaded yet.</Text>
                </View>
              ) : (
                <View className="mt-2 flex-row flex-wrap gap-3">
                  {proofs.map((p, idx) => (
                    <View key={`${p.url}-${idx}`} className="w-[48%] bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <Image
                        source={{ uri: absUrl(p.url) }}
                        style={{ width: "100%", height: 140 }}
                        contentFit="cover"
                      />
                      <View className="p-3">
                        <Text className="text-gray-800 text-xs font-semibold">
                          {new Date(p.uploadedAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
