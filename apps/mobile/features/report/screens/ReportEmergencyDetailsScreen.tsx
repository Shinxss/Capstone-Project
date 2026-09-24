import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapboxGL from "@rnmapbox/maps";
import { useSubmitReport } from "../hooks/useSubmitReport";
import { useReportDraft } from "../hooks/useReportDraft";
import { useReportPhotos } from "../hooks/useReportPhotos";
import { getCurrentCoords, reverseGeocodeCoords } from "../../../shared/services/locationService";
import { ProofUploader } from "../components/ProofUploader";
import {
  MAX_PROOF_IMAGES,
  REQUIRED_PROOF_IMAGES,
} from "../constants/report.constants";

import { useConnectivity } from "../../connectivity/hooks/useConnectivity";

const DAGUPAN_CENTER: [number, number] = [120.34, 16.043];
const FALLBACK_CENTER: [number, number] = DAGUPAN_CENTER;
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
}

function toLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function ReportEmergencyDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { isOffline } = useConnectivity();
  const { draft, setDescription, setLocation, setLocationText } = useReportDraft();
  const { loading, submit } = useSubmitReport();
  const { photos, pickFromLibrary, takePhoto, removePhoto, hasError } = useReportPhotos();
  const [proofSheetVisible, setProofSheetVisible] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    draft.location
      ? [draft.location.coords.longitude, draft.location.coords.latitude] as [number, number]
      : FALLBACK_CENTER
  );
  const [mapPicked, setMapPicked] = useState<[number, number] | null>(
    draft.location
      ? [draft.location.coords.longitude, draft.location.coords.latitude] as [number, number]
      : null
  );
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [pickedAddress, setPickedAddress] = useState<string | null>(
    draft.locationText?.trim() || draft.location?.label?.trim() || null
  );

  const hasCoords = Boolean(draft.location?.coords);
  const validLocalPhotosCount = photos.filter(
    (photo) => Boolean(photo.localUri) && !photo.error
  ).length;
  const canSubmit =
    Boolean(draft.type && hasCoords) &&
    validLocalPhotosCount === REQUIRED_PROOF_IMAGES &&
    photos.length === MAX_PROOF_IMAGES &&
    !loading &&
    !hasError;
  const locationValue = draft.locationText ?? draft.location?.label ?? "";
  const markerCoordinate = useMemo(() => mapPicked, [mapPicked]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (draft.location?.coords) {
        const existing: [number, number] = [
          draft.location.coords.longitude,
          draft.location.coords.latitude
        ];
        setMapCenter(existing);
        setMapPicked(existing);
        return;
      }

      try {
        const current = await getCurrentCoords();
        if (!active) return;
        setMapCenter([current.longitude, current.latitude]);
      } catch {
        // keep fallback center
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [draft.location?.coords]);

  useEffect(() => {
    if (!mapPicked) {
      setPickedAddress(null);
      return;
    }

    let active = true;
    const [longitude, latitude] = mapPicked;

    const resolve = async () => {
      setResolvingAddress(true);
      const address = await reverseGeocodeCoords({ latitude, longitude });
      if (!active) return;
      setPickedAddress(address || toLabel(latitude, longitude));
      setResolvingAddress(false);
    };

    void resolve();
    return () => {
      active = false;
    };
  }, [mapPicked]);

  const onUseCurrentLocation = async () => {
    try {
      const coords = await getCurrentCoords();
      const [longitude, latitude] = [coords.longitude, coords.latitude];
      const address = await reverseGeocodeCoords({ latitude, longitude }).catch(() => null);
      const label = address ?? toLabel(latitude, longitude);
      setLocationText(label);
      setLocation({ latitude, longitude }, label);
      setMapCenter([longitude, latitude]);
      setMapPicked([longitude, latitude]);
      setPickedAddress(label);
    } catch (error: any) {
      Alert.alert("Location unavailable", error?.message ?? "Unable to get current location.");
    }
  };

  const onUsePinnedLocation = () => {
    if (!mapPicked) return;

    const [longitude, latitude] = mapPicked;
    const label = pickedAddress?.trim() || toLabel(latitude, longitude);
    setLocationText(label);
    setLocation({ latitude, longitude }, label);
    setShowMapPicker(false);
  };

  const onAddPhoto = () => {
    if (photos.length >= MAX_PROOF_IMAGES) return;
    setProofSheetVisible(true);
  };

  const onPickFromLibrary = () => {
    setProofSheetVisible(false);
    void pickFromLibrary();
  };

  const onTakePhoto = () => {
    setProofSheetVisible(false);
    void takePhoto();
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    const reportLng = draft.location?.coords?.longitude;
    const reportLat = draft.location?.coords?.latitude;
    if (!Number.isFinite(reportLng) || !Number.isFinite(reportLat)) return;

    try {
      const response = await submit(draft);
      router.replace({
        pathname: "/report/success",
        params: {
          incidentId: response.incidentId,
          referenceNumber: response.referenceNumber,
          clientRequestId: response.clientRequestId,
          deliveryMode: response.deliveryMode ?? "online",
          isSos: "0",
          reportLng: String(reportLng),
          reportLat: String(reportLat),
        },
      });
    } catch (error: any) {
      Alert.alert("Submit failed", error?.message ?? "Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-zinc-100">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
      >
        <Text className="text-3xl font-semibold text-zinc-900">Provide details</Text>
        <Text className="mt-1 text-base text-zinc-500">Help responders understand the situation</Text>

        <View className="mt-8">
          <Text className="text-xl font-semibold text-zinc-900">Location *</Text>
          <View className="mt-3 flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                if (isOffline) {
                  Alert.alert(
                    "Map Unavailable Offline",
                    "Map preview is unavailable offline. Use your current GPS location."
                  );
                  return;
                }
                setShowMapPicker((current) => !current);
              }}
              className="h-12 flex-1 items-start justify-center rounded-2xl border border-zinc-300 px-4"
            >
              <Text
                numberOfLines={1}
                className={`text-base ${locationValue ? "text-zinc-900" : "text-zinc-500"}`}
              >
                {locationValue || "Choose location on map"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onUseCurrentLocation}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-zinc-300"
            >
              <Ionicons name="location-outline" size={20} color="#111827" />
            </Pressable>
          </View>
          <Text className="mt-2 text-sm text-zinc-500">
            Tap the address button to show the map and choose your pinpoint location
          </Text>

          {showMapPicker ? (
            <View className="mt-3 overflow-hidden rounded-2xl border border-zinc-300 bg-white">
              <View style={{ height: 240 }}>
                <MapboxGL.MapView
                  style={{ flex: 1 }}
                  styleURL={MapboxGL.StyleURL.Street}
                  scaleBarEnabled={false}
                  compassEnabled
                  surfaceView={false}
                  requestDisallowInterceptTouchEvent={true}
                  onPress={(event) => {
                    if (event.geometry.type !== "Point") return;
                    const coordinates = event.geometry.coordinates;
                    const clamped: [number, number] = [coordinates[0], coordinates[1]];
                    setMapPicked(clamped);
                    setMapCenter(clamped);
                  }}
                >
                  <MapboxGL.Camera
                    centerCoordinate={mapCenter}
                    zoomLevel={14}
                    animationMode="flyTo"
                  />

                  {markerCoordinate ? (
                    <MapboxGL.MarkerView coordinate={markerCoordinate} anchor={{ x: 0.5, y: 1 }}>
                      <View className="h-5 w-5 rounded-full border-2 border-white bg-red-500" />
                    </MapboxGL.MarkerView>
                  ) : null}
                </MapboxGL.MapView>
              </View>

              <View className="border-t border-zinc-200 px-3 py-3">
                {resolvingAddress ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#334155" />
                    <Text className="text-sm text-zinc-600">Resolving exact address...</Text>
                  </View>
                ) : (
                  <Text className="text-sm text-zinc-700">
                    {pickedAddress || "Tap anywhere on the map to drop a pin."}
                  </Text>
                )}

                <View className="mt-3 flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setShowMapPicker(false)}
                    className="h-10 flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white"
                  >
                    <Text className="text-sm font-semibold text-zinc-700">Close Map</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (isOffline) {
                        Alert.alert(
                          "Map Unavailable Offline",
                          "Map preview is unavailable offline. Use your current GPS location."
                        );
                        return;
                      }
                      setShowMapPicker(false);
                      router.push("/report/pick-location");
                    }}
                    className="h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white"
                    accessibilityLabel="Open Fullscreen Map"
                  >
                    <Ionicons name="expand-outline" size={18} color="#374151" />
                  </Pressable>

                  <Pressable
                    onPress={onUsePinnedLocation}
                    disabled={!mapPicked || resolvingAddress}
                    className={`h-10 flex-1 items-center justify-center rounded-xl ${mapPicked && !resolvingAddress ? "bg-red-500" : "bg-zinc-300"
                      }`}
                  >
                    <Text className="text-sm font-semibold text-white">Use Pinpoint</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View className="mt-8">
          <Text className="text-xl font-semibold text-zinc-900">Description (optional)</Text>
          <TextInput
            value={draft.description ?? ""}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            maxLength={1000}
            textAlignVertical="top"
            placeholder="Describe what's happening, any injuries, how many people involved..."
            placeholderTextColor="#71717a"
            className="mt-3 min-h-[130px] rounded-2xl border border-zinc-300 px-4 py-3 text-base text-zinc-900"
          />
        </View>

        <ProofUploader
          photos={photos}
          hasError={hasError}
          onAddPhoto={onAddPhoto}
          onRemovePhoto={removePhoto}
        />
      </ScrollView>

      <Modal
        visible={proofSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofSheetVisible(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setProofSheetVisible(false)}>
          <Pressable
            style={[styles.sheetCard, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}
            onPress={() => { }}
          >
            <Text style={styles.sheetTitle}>Add Proof Photo</Text>

            <Pressable onPress={onTakePhoto} style={styles.sheetAction}>
              <Ionicons name="camera-outline" size={20} color="#111827" />
              <Text style={styles.sheetActionText}>Take Photo</Text>
            </Pressable>

            <Pressable onPress={onPickFromLibrary} style={styles.sheetAction}>
              <Ionicons name="images-outline" size={20} color="#111827" />
              <Text style={styles.sheetActionText}>Choose from Album</Text>
            </Pressable>

            <Pressable
              onPress={() => setProofSheetVisible(false)}
              style={[styles.sheetAction, styles.sheetCancel]}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Submitting..." : "Submit Report"}
            </Text>
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: "48.5%",
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "600",
  },
  submitButton: {
    width: "48.5%",
    height: 60,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ec8585",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 26,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  sheetAction: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  sheetActionText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  sheetCancel: {
    justifyContent: "center",
  },
  sheetCancelText: {
    width: "100%",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
});
