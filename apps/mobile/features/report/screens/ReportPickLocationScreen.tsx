import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapboxGL from "@rnmapbox/maps";
import { router } from "expo-router";
import { useReportDraft } from "../hooks/useReportDraft";
import { getCurrentCoords } from "../../../shared/services/locationService";

const FALLBACK_CENTER: [number, number] = [120.9842, 14.5995];
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
}

function toLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function ReportPickLocationScreen() {
  const { draft, setLocation } = useReportDraft();
  const [center, setCenter] = useState<[number, number]>(
    draft.location
      ? [draft.location.coords.longitude, draft.location.coords.latitude]
      : FALLBACK_CENTER
  );
  const [picked, setPicked] = useState<[number, number] | null>(
    draft.location ? [draft.location.coords.longitude, draft.location.coords.latitude] : null
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (draft.location) {
        const existing: [number, number] = [
          draft.location.coords.longitude,
          draft.location.coords.latitude,
        ];
        if (active) setCenter(existing);
        return;
      }

      try {
        const current = await getCurrentCoords();
        if (!active) return;

        const nextCenter: [number, number] = [current.longitude, current.latitude];
        setCenter(nextCenter);
        setPicked(nextCenter);
      } catch {
        // keep fallback center
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  const markerCoordinate = useMemo(() => picked, [picked]);

  const onUseLocation = () => {
    if (!picked) return;

    setLocation(
      {
        latitude: picked[1],
        longitude: picked[0],
      },
      toLabel(picked[1], picked[0])
    );

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <Text className="text-lg font-bold text-white">Pick Location</Text>
      </View>

      <View className="flex-1 overflow-hidden">
        <MapboxGL.MapView
          style={{ flex: 1 }}
          styleURL={MapboxGL.StyleURL.Street}
          scaleBarEnabled={false}
          compassEnabled
          onPress={(event) => {
            if (event.geometry.type !== "Point") return;
            const coordinates = event.geometry.coordinates;
            setPicked([coordinates[0], coordinates[1]]);
          }}
        >
          <MapboxGL.Camera centerCoordinate={center} zoomLevel={13} animationMode="flyTo" />

          {markerCoordinate ? (
            <MapboxGL.MarkerView coordinate={markerCoordinate} anchor={{ x: 0.5, y: 1 }}>
              <View className="h-5 w-5 rounded-full border-2 border-white bg-red-500" />
            </MapboxGL.MarkerView>
          ) : null}
        </MapboxGL.MapView>
      </View>

      <View className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="h-12 flex-1 items-center justify-center rounded-xl border border-zinc-700"
          >
            <Text className="text-base font-semibold text-white">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={onUseLocation}
            disabled={!picked}
            className={`h-12 flex-1 items-center justify-center rounded-xl ${
              picked ? "bg-red-500" : "bg-zinc-700"
            }`}
          >
            <Text className="text-base font-semibold text-white">Use this location</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
