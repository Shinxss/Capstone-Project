import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapboxGL from "@rnmapbox/maps";
import { useSubmitReport } from "../hooks/useSubmitReport";
import { useReportDraft } from "../hooks/useReportDraft";
import { useReportPhotos } from "../hooks/useReportPhotos";
import { getCurrentCoords, reverseGeocodeCoords } from "../../../shared/services/locationService";

const DAGUPAN_CENTER: [number, number] = [120.34, 16.043];
const DAGUPAN_BOUNDS = {
  sw: [120.25, 15.98] as [number, number],
  ne: [120.43, 16.12] as [number, number],
} as const;
const FALLBACK_CENTER: [number, number] = DAGUPAN_CENTER;
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
}

function toLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function clampToDagupanBounds(longitude: number, latitude: number): [number, number] {
  const clampedLongitude = Math.min(DAGUPAN_BOUNDS.ne[0], Math.max(DAGUPAN_BOUNDS.sw[0], longitude));
  const clampedLatitude = Math.min(DAGUPAN_BOUNDS.ne[1], Math.max(DAGUPAN_BOUNDS.sw[1], latitude));
  return [clampedLongitude, clampedLatitude];
}

export function ReportEmergencyDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { draft, setDescription, setLocation, setLocationText } = useReportDraft();
  const { loading, submit } = useSubmitReport();
  const { photos, pickFromLibrary, takePhoto, removePhoto, hasUploading, hasError } = useReportPhotos();
  const [proofSheetVisible, setProofSheetVisible] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    draft.location
      ? clampToDagupanBounds(draft.location.coords.longitude, draft.location.coords.latitude)
      : FALLBACK_CENTER
  );
  const [mapPicked, setMapPicked] = useState<[number, number] | null>(
    draft.location
      ? clampToDagupanBounds(draft.location.coords.longitude, draft.location.coords.latitude)
      : null
  );
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [pickedAddress, setPickedAddress] = useState<string | null>(
    draft.locationText?.trim() || draft.location?.label?.trim() || null
  );

  const hasCoords = Boolean(draft.location?.coords);
  const uploadedProofCount = photos.filter((photo) => Boolean(photo.url)).length;
  const hasMissingPhotoUrl = photos.some((photo) => !photo.url);
  const canSubmit =
    Boolean(draft.type && hasCoords) &&
    uploadedProofCount >= 3 &&
    !loading &&
    !hasUploading &&
    !hasError &&
    !hasMissingPhotoUrl;
  const locationValue = draft.locationText ?? draft.location?.label ?? "";
  const markerCoordinate = useMemo(() => mapPicked, [mapPicked]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (draft.location?.coords) {
        const existing = clampToDagupanBounds(
          draft.location.coords.longitude,
          draft.location.coords.latitude
        );
        setMapCenter(existing);
        setMapPicked(existing);
        return;
      }

      try {
        const current = await getCurrentCoords();
        if (!active) return;
        setMapCenter(clampToDagupanBounds(current.longitude, current.latitude));
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
      const [longitude, latitude] = clampToDagupanBounds(coords.longitude, coords.latitude);
      const address = await reverseGeocodeCoords({ latitude, longitude });
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

    try {
      const response = await submit(draft);
      router.replace({
        pathname: "/report/success",
        params: {
          incidentId: response.incidentId,
          referenceNumber: response.referenceNumber,
          isSos: "0",
        },
      });
    } catch (error: any) {
      Alert.alert("Submit failed", error?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-zinc-100">
      <ScrollView
        scrollEnabled={!showMapPicker}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 220 }}
      >
        <Text className="text-3xl font-semibold text-zinc-900">Provide details</Text>
        <Text className="mt-1 text-base text-zinc-500">Help responders understand the situation</Text>

        <View className="mt-8">
          <Text className="text-xl font-semibold text-zinc-900">Location *</Text>
          <View className="mt-3 flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowMapPicker((current) => !current)}
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
                  onPress={(event) => {
                    if (event.geometry.type !== "Point") return;
                    const coordinates = event.geometry.coordinates;
                    const clamped = clampToDagupanBounds(coordinates[0], coordinates[1]);
                    setMapPicked(clamped);
                    setMapCenter(clamped);
                  }}
                >
                  <MapboxGL.Camera
                    centerCoordinate={mapCenter}
                    zoomLevel={14}
                    animationMode="flyTo"
                    maxBounds={DAGUPAN_BOUNDS}
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
                    onPress={onUsePinnedLocation}
                    disabled={!mapPicked || resolvingAddress}
                    className={`h-10 flex-1 items-center justify-center rounded-xl ${
                      mapPicked && !resolvingAddress ? "bg-red-500" : "bg-zinc-300"
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

        <View className="mt-8">
          <Text className="text-xl font-semibold text-zinc-900">Proof *</Text>
          <View className="mt-3 flex-row flex-wrap gap-3">
            <Pressable
              onPress={onAddPhoto}
              disabled={photos.length >= 5}
              className={`h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-zinc-300 ${
                photos.length >= 5 ? "opacity-40" : ""
              }`}
            >
              <Ionicons name="camera-outline" size={20} color="#71717a" />
              <Text className="mt-1 text-sm text-zinc-500">Add</Text>
            </Pressable>

            {photos.map((photo, index) => (
              <View
                key={`${photo.localUri}-${index}`}
                className="h-24 w-24 overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-200"
              >
                <Image
                  source={{ uri: photo.localUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />

                <Pressable
                  onPress={() => removePhoto(index)}
                  className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70"
                >
                  <Ionicons name="close" size={14} color="#ffffff" />
                </Pressable>

                {photo.uploading ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/45">
                    <Text className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      Uploading...
                    </Text>
                  </View>
                ) : null}

                {photo.error ? (
                  <View className="absolute bottom-1 left-1 right-1 rounded-md bg-red-500 px-1 py-0.5">
                    <Text className="text-center text-[10px] font-medium text-white">Upload failed</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          {hasError ? (
            <Text className="mt-2 text-xs text-red-500">
              Remove failed photo uploads before submitting your report.
            </Text>
          ) : uploadedProofCount < 3 ? (
            <Text className="mt-2 text-xs text-red-500">
              Upload at least 3 proof images before submitting.
            </Text>
          ) : (
            <Text className="mt-2 text-xs text-zinc-500">
              Upload at least 3 proof images (max 5).
            </Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={proofSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofSheetVisible(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setProofSheetVisible(false)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Add Proof</Text>

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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
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
