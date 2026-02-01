import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable, StyleSheet, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapboxGL, { Logger } from "@rnmapbox/maps";
import { useMapStyle } from "../../features/map/hooks/useMapStyle";
import { Feather } from "@expo/vector-icons";

const DAGUPAN: [number, number] = [120.3333, 16.0438];
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
  Logger.setLogLevel("verbose"); // helps when checking logs
}

export default function MapTab() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const { key: styleKey, styleURL, next } = useMapStyle("dark");

  const camera = useMemo(
    () => ({
      centerCoordinate: DAGUPAN,
      zoomLevel: 12,
      animationDuration: 0,
    }),
    []
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        {/* ✅ MapView gets the real layout */}
        <MapboxGL.MapView
          style={styles.map}
          styleURL={styleURL}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingStyle={() => {
            console.log("[Mapbox] style loaded ✅");
            setMapStatus("ready");
          }}
          onMapLoadingError={() => {
            console.log("[Mapbox] map loading error ❌");
            setMapStatus("error");
          }}
        >
          <MapboxGL.Camera
            centerCoordinate={camera.centerCoordinate}
            zoomLevel={camera.zoomLevel}
            animationDuration={camera.animationDuration}
          />
        </MapboxGL.MapView>


        {/* ✅ Transparent overlay (won’t hide the map) */}
        <View pointerEvents="box-none" style={styles.overlay}>
          {/* Search */}
          <View style={[styles.searchWrap, { marginTop: Math.max(8, insets.top + 6) }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder=" "
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
          </View>

          {/* Layers button */}
          <Pressable
            style={[styles.layersBtn, { top: Math.max(12, insets.top + 10) }]}
            onPress={next}
          >
            <Feather name="layers" size={18} color="#666" />
          </Pressable>


          {/* Debug pill */}
          <View style={[styles.statusPill, { top: Math.max(92, insets.top + 90) }]}>
            <Text style={styles.statusText}>Style: {styleKey}</Text>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "black" },
  root: { flex: 1, position: "relative" },
  map: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent", // ✅ MUST be transparent
  },

  searchWrap: {
    marginHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.65)",
    justifyContent: "center",
  },
  searchInput: {
    paddingHorizontal: 14,
    color: "#222",
  },
  layersBtn: {
    position: "absolute",
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    position: "absolute",
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  statusText: { fontSize: 12, color: "#333" },
});
