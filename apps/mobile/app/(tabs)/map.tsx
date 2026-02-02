import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapboxGL, { Logger } from "@rnmapbox/maps";
import { useMapStyle } from "../../features/map/hooks/useMapStyle";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

type EmergencyType = "SOS" | "Flood" | "Fire" | "Typhoon" | "Earthquake" | "Collapse";

type EmergencyReport = {
  id: string;
  type: EmergencyType;
  title: string;
  description?: string;
  lng: number;
  lat: number;
  updated?: string;
};

const DAGUPAN: [number, number] = [120.3333, 16.0438];
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
  Logger.setLogLevel("verbose");
}

const colorForType = (type: EmergencyType) => {
  switch (type) {
    case "Flood":
      return "#2563EB";
    case "Fire":
      return "#DC2626";
    case "Typhoon":
      return "#B91C1C";
    case "Earthquake":
      return "#F59E0B";
    case "Collapse":
      return "#CA8A04";
    case "SOS":
      return "#EF4444";
    default:
      return "#64748B";
  }
};

// ✅ MaterialCommunityIcons mapping
const mciForType = (type: EmergencyType) => {
  switch (type) {
    case "Fire":
      return "fire";
    case "Flood":
      return "water";
    case "Typhoon":
      return "weather-hurricane";
    case "Earthquake":
      return "chart-bell-curve-cumulative";
    case "Collapse":
      return "home-city";
    case "SOS":
      return "alarm-light";
    default:
      return "alert";
  }
};

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * ✅ Big pulse wave (RN Animated version of your CSS)
 */
function PulseMarker({ type }: { type: EmergencyType }) {
  const color = colorForType(type);
  const icon = mciForType(type) as any;

  const scale1 = useRef(new Animated.Value(0.2)).current;
  const scale2 = useRef(new Animated.Value(0.2)).current;
  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (scale: Animated.Value, opacity: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 0.85, duration: 180, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 1620, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(scale, { toValue: 0.2, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const loop1 = makeLoop(scale1, opacity1, 0);
    const loop2 = makeLoop(scale2, opacity2, 900);

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [scale1, scale2, opacity1, opacity2]);

  return (
    <View style={styles.markerWrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.pulse,
          {
            borderColor: hexToRgba(color, 0.35),
            backgroundColor: hexToRgba(color, 0.18),
            opacity: opacity1,
            transform: [{ scale: scale1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          {
            borderColor: hexToRgba(color, 0.22),
            backgroundColor: hexToRgba(color, 0.1),
            opacity: opacity2,
            transform: [{ scale: scale2 }],
          },
        ]}
      />

      <View style={[styles.pin, { borderColor: hexToRgba(color, 0.95) }]}>
        <View style={styles.innerWave} />
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      </View>
    </View>
  );
}

export default function MapTab() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const { key: styleKey, styleURL, next } = useMapStyle("dark");

  // ✅ hardcoded emergencies (Dagupan-only)
  const reports: EmergencyReport[] = useMemo(
    () => [
      {
        id: "sos-1",
        type: "SOS",
        title: "SOS: Flood Rescue Needed",
        description: "Caller stranded near Calmay area.",
        lng: 120.3298,
        lat: 16.0562,
        updated: "15 min ago",
      },
      {
        id: "fire-1",
        type: "Fire",
        title: "Residential Fire",
        description: "Reported smoke in Poblacion.",
        lng: 120.3339,
        lat: 16.0446,
        updated: "32 min ago",
      },
      {
        id: "collapse-1",
        type: "Collapse",
        title: "Structure Collapse",
        description: "Possible injuries near Pantal.",
        lng: 120.3475,
        lat: 16.047,
        updated: "2 hours ago",
      },
      {
        id: "typhoon-1",
        type: "Typhoon",
        title: "Typhoon Evac Support",
        description: "Evacuation support needed.",
        lng: 120.304,
        lat: 16.0328,
        updated: "45 min ago",
      },
    ],
    []
  );

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [reports, query]);

  const camera = useMemo(
    () => ({
      centerCoordinate: DAGUPAN,
      zoomLevel: 12,
      animationDuration: 0,
    }),
    []
  );

  // ✅ draggable “Google Maps-ish” sheet
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["22%", "45%"], []);
  const [selected, setSelected] = useState<EmergencyReport | null>(null);

  const openSheet = (r: EmergencyReport) => {
    setSelected(r);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  };

  // ✅ chips (replace old status pill)
  const chips = useMemo(
    () => [
      { key: "home", label: "Set home", icon: "home" as const },
      { key: "evac", label: "Evacuation", icon: "flag" as const },
      { key: "shelter", label: "Shelters", icon: "map-pin" as const },
      { key: "hospital", label: "Hospitals", icon: "plus-square" as const },
      { key: "hotline", label: "Hotlines", icon: "phone" as const },
    ],
    []
  );

  const [activeChip, setActiveChip] = useState<string>("home");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={styleURL}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingStyle={() => console.log("[Mapbox] style loaded ✅", styleKey)}
           onMapLoadingError={() => {
            console.log("[Mapbox] map loading error ❌");
           }}
        >
          <MapboxGL.Camera
            centerCoordinate={camera.centerCoordinate}
            zoomLevel={camera.zoomLevel}
            animationDuration={camera.animationDuration}
          />

          {filteredReports.map((r) => (
            <MapboxGL.MarkerView
              key={r.id}
              coordinate={[r.lng, r.lat]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <Pressable onPress={() => openSheet(r)} style={{ padding: 2 }}>
                <PulseMarker type={r.type} />
              </Pressable>
            </MapboxGL.MarkerView>
          ))}
        </MapboxGL.MapView>

        {/* ✅ Google-Maps-like top UI */}
        <View pointerEvents="box-none" style={styles.overlay}>
          <View style={[styles.topUi, { paddingTop: Math.max(10, insets.top + 8) }]}>
            {/* Search bar (white) */}
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#777" />

              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search here"
                placeholderTextColor="#8a8a8a"
                style={styles.searchInput}
              />

              {/* ✅ Layers button INSIDE bar (moved position) */}
              <Pressable onPress={next} style={styles.barIconBtn} hitSlop={10}>
                <Feather name="layers" size={18} color="#444" />
              </Pressable>

              {/* ✅ Profile avatar */}
              <Pressable
                onPress={() => console.log("profile")}
                style={styles.avatar}
                hitSlop={10}
              >
                <Feather name="user" size={16} color="#111" />
              </Pressable>
            </View>

            {/* Chips row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {chips.map((c) => {
                const active = activeChip === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setActiveChip(c.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Feather
                      name={c.icon}
                      size={16}
                      color={active ? "#111" : "#444"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Bottom sheet */}
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View
                  style={[
                    styles.sheetIcon,
                    {
                      backgroundColor: selected
                        ? hexToRgba(colorForType(selected.type), 0.15)
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  {selected ? (
                    <MaterialCommunityIcons
                      name={mciForType(selected.type) as any}
                      size={18}
                      color={colorForType(selected.type)}
                    />
                  ) : (
                    <MaterialCommunityIcons name={"alert"} size={18} color={"#666"} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {selected?.title ?? "Select an emergency"}
                  </Text>
                  <Text style={styles.sheetSub} numberOfLines={2}>
                    {selected?.description ?? "Tap a marker to see details."}
                  </Text>
                </View>

                <Pressable onPress={() => sheetRef.current?.close()} style={styles.sheetClose}>
                  <Feather name="x" size={18} color="#444" />
                </Pressable>
              </View>

              {selected ? (
                <View style={styles.sheetMetaRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        borderColor: hexToRgba(colorForType(selected.type), 0.35),
                        backgroundColor: hexToRgba(colorForType(selected.type), 0.12),
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colorForType(selected.type) }]}>
                      {selected.type}
                    </Text>
                  </View>
                  <Text style={styles.updatedText}>Updated {selected.updated ?? "just now"}</Text>
                </View>
              ) : null}
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}

const PULSE_SIZE = 120;
const PIN_SIZE = 34;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "black" },
  root: { flex: 1, position: "relative" },
  map: { flex: 1 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },

  // ✅ top UI container
  topUi: {
    paddingHorizontal: 12,
  },

  // ✅ White search bar
  searchBar: {
    height: 50,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    // shadow
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    fontSize: 16,
    color: "#111",
  },
  barIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  // chips
  chipsRow: {
    paddingTop: 10,
    paddingBottom: 2,
    gap: 10,
  },
  chip: {
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  chipActive: {
    backgroundColor: "#FFFFFF",
  },
  chipText: { fontSize: 14, color: "#222", fontWeight: "600" },
  chipTextActive: { color: "#111" },

  // marker
  markerWrap: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  pulse: {
    position: "absolute",
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: 9999,
    borderWidth: 2,
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: 9999,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.98)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  innerWave: {
    position: "absolute",
    left: 5,
    top: 5,
    right: 5,
    bottom: 5,
    borderRadius: 9999,
    backgroundColor: "rgba(0,0,0,0.03)",
  },

  // sheet
  sheetBg: { backgroundColor: "rgba(255,255,255,0.95)" },
  sheetHandle: { backgroundColor: "rgba(0,0,0,0.25)", width: 42 },
  sheetContent: { paddingHorizontal: 16, paddingTop: 10 },
  sheetHeader: { paddingBottom: 8 },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  sheetSub: { marginTop: 2, fontSize: 12, color: "#555" },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  sheetMetaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  updatedText: { fontSize: 12, color: "#444" },
});
