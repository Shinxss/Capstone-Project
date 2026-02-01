import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useMapStyle } from "../../features/map/hooks/useMapStyle";

// Dagupan City (approx)
const DAGUPAN = { longitude: 120.3333, latitude: 16.0438 };

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

/**
 * IMPORTANT:
 * - Do NOT static-import "@rnmapbox/maps" here.
 * - In Expo Go, it will throw "native code not available" and crash the route.
 * - We load it safely via require() so the screen still renders (fallback UI).
 */
function getMapbox() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@rnmapbox/maps");
    return (mod?.default ?? mod) as any;
  } catch {
    return null;
  }
}

export default function MapTab() {
  const [query, setQuery] = useState("");
  const { styleURL, toggle } = useMapStyle("dark");

  const MapboxGL = useMemo(() => getMapbox(), []);

  useEffect(() => {
    if (!MapboxGL || !TOKEN) return;
    MapboxGL.setAccessToken(TOKEN);
    MapboxGL.setTelemetryEnabled(false);
  }, [MapboxGL]);

  const camera = useMemo(
    () => ({
      centerCoordinate: [DAGUPAN.longitude, DAGUPAN.latitude] as [number, number],
      zoomLevel: 11.8,
      animationMode: "none" as const,
    }),
    []
  );

  const MapView = MapboxGL?.MapView;
  const Camera = MapboxGL?.Camera;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "left", "right"]}>
      <View className="flex-1">
        {/* MAP (or fallback) */}
        {MapView && Camera ? (
          <MapView
            style={StyleSheet.absoluteFill}
            styleURL={styleURL}
            logoEnabled={false}
            attributionEnabled={false}
            compassEnabled={false}
            scaleBarEnabled={false}
          >
            <Camera {...camera} />
          </MapView>
        ) : (
          <View style={StyleSheet.absoluteFill} className="bg-black items-center justify-center px-6">
            <Text className="text-white text-center text-base font-semibold">
              Mapbox needs a Development Build (not Expo Go).
            </Text>
            <Text className="text-white/70 text-center mt-2">
              Follow the steps below to rebuild using a dev client, then this map will render.
            </Text>
          </View>
        )}

        {/* TOP UI OVERLAY (like your screenshot) */}
        <View
          pointerEvents="box-none"
          style={[styles.topOverlay, { paddingTop: Platform.OS === "ios" ? 6 : 10 }]}
        >
          <View className="px-3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder=""
              placeholderTextColor="#777"
              className="h-10 rounded-md bg-[#e6e6e6]/95 px-3 text-[14px] text-black"
              returnKeyType="search"
            />
          </View>

          <View className="absolute right-3 top-1">
            <Pressable
              onPress={toggle}
              className="h-10 w-10 items-center justify-center rounded-md bg-black/45"
              style={styles.layersShadow}
              android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: true }}
            >
              <Feather name="layers" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topOverlay: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 10 },
  layersShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
