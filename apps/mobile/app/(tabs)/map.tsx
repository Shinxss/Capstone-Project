import React, { useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
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
import * as Location from "expo-location";
import { useMapStyle } from "../../features/map/hooks/useMapStyle";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { api } from "../../lib/api";
import { fetchEmergencyMapReports } from "../../features/emergency/services/emergencyApi";

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

type HazardZone = {
  _id: string;
  name: string;
  hazardType?: string;
  isActive?: boolean;
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
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

const hazardColorForType = (raw?: string) => {
  const t = String(raw ?? "").toUpperCase();
  if (t === "FLOODED" || t === "FLOOD") return { fill: "#0ea5e9", line: "#0ea5e9" };
  if (t === "ROAD_CLOSED") return { fill: "#fb7185", line: "#fb7185" };
  if (t === "FIRE_RISK" || t === "FIRE") return { fill: "#f97316", line: "#f97316" };
  if (t === "LANDSLIDE") return { fill: "#a855f7", line: "#a855f7" };
  if (t === "UNSAFE") return { fill: "#eab308", line: "#eab308" };
  return { fill: "#eab308", line: "#eab308" };
};

function normalizeEmergencyType(raw: string): EmergencyType {
  const t = String(raw ?? "").toUpperCase();
  if (t === "FLOOD") return "Flood";
  if (t === "FIRE") return "Fire";
  if (t === "EARTHQUAKE") return "Earthquake";
  if (t === "SOS") return "SOS";
  // keep the UI simple for now
  return "SOS";
}

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
  const { key: styleKey, styleURL, next } = useMapStyle("streets");

  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<
    { feature: any; distance: number; duration: number; profile: "driving" | "walking" } | null
  >(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMode, setRouteMode] = useState<"driving" | "walking">("driving");
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [reports, setReports] = useState<EmergencyReport[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadHazardZones = async () => {
      try {
        const res = await api.get<{ data: HazardZone[] }>("/api/hazard-zones", {
          params: { limit: 500 },
        });
        if (cancelled) return;
        setHazardZones(res.data?.data ?? []);
      } catch {
        if (!cancelled) setHazardZones([]);
      }
    };

    void loadHazardZones();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEmergencyReports = async () => {
      try {
        const items = await fetchEmergencyMapReports();
        if (cancelled) return;

        setReports(
          items.map((item) => ({
            id: item.incidentId,
            type: normalizeType(item.type),
            title: `${normalizeType(item.type)} Emergency`,
            description: item.description,
            lng: item.location.coords.longitude,
            lat: item.location.coords.latitude,
            updated: item.createdAt ? new Date(item.createdAt).toLocaleString() : "just now",
          }))
        );
      } catch {
        if (!cancelled) setReports([]);
      }
    };

    void loadEmergencyReports();
    const timer = setInterval(() => {
      void loadEmergencyReports();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // ✅ Keep current location for routing (Direction button)
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setMyLocation([current.coords.longitude, current.coords.latitude]);

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (loc) => setMyLocation([loc.coords.longitude, loc.coords.latitude])
        );
      } catch {
        // ignore
      }
    })();

    return () => {
      try {
        sub?.remove();
      } catch {
        // ignore
      }
    };
  }, []);


  const normalizeType = (raw: string): EmergencyType => {
    const t = String(raw ?? "").toUpperCase();
    if (t === "FIRE") return "Fire";
    if (t === "FLOOD") return "Flood";
    if (t === "EARTHQUAKE") return "Earthquake";
    if (t === "TYPHOON") return "Typhoon";
    if (t === "COLLAPSE") return "Collapse";
    if (t === "SOS") return "SOS";
    return "SOS";
  };
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

  const hazardZonesGeoJSON = useMemo(() => {
    const features = (hazardZones ?? [])
      .filter((z) => z?.isActive !== false)
      .filter((z) => z?.geometry?.type === "Polygon" || z?.geometry?.type === "MultiPolygon")
      .filter((z) => Array.isArray(z?.geometry?.coordinates))
      .map((z) => {
        const colors = hazardColorForType(z.hazardType);
        return {
          type: "Feature",
          properties: {
            id: String(z._id),
            name: z.name,
            hazardType: z.hazardType ?? "UNKNOWN",
            fillColor: colors.fill,
            lineColor: colors.line,
          },
          geometry: z.geometry,
        };
      });

    return {
      type: "FeatureCollection",
      features,
    } as any;
  }, [hazardZones]);

  const camera = useMemo(
    () => ({
      centerCoordinate: DAGUPAN,
      zoomLevel: 12,
      animationDuration: 0,
    }),
    []
  );

  const cameraRef = useRef<MapboxGL.Camera>(null);

  // ✅ draggable “Google Maps-ish” sheet
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["22%", "45%"], []);
  const [selected, setSelected] = useState<EmergencyReport | null>(null);

  const openSheet = (r: EmergencyReport) => {
    setSelected(r);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  };


  const fetchRouteFromMapbox = async (
    start: [number, number],
    end: [number, number],
    profile: "driving" | "walking"
  ) => {
    if (!TOKEN) throw new Error("Missing Mapbox token");

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
      `${start[0]},${start[1]};${end[0]},${end[1]}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${TOKEN}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Directions API failed");
    const json: any = await res.json();

    const r0 = json?.routes?.[0];
    const coords = r0?.geometry?.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length < 2) throw new Error("No route");

    return {
      feature: { type: "Feature", properties: {}, geometry: r0.geometry } as any,
      distance: Number(r0.distance ?? 0), // meters
      duration: Number(r0.duration ?? 0), // seconds
    };
  };

  const fitRoute = (coords: [number, number][]) => {
    try {
      let minLng = coords[0][0];
      let maxLng = coords[0][0];
      let minLat = coords[0][1];
      let maxLat = coords[0][1];

      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }

      // Use bounds when available (cast to any to avoid TS type issues)
      (cameraRef.current as any)?.setCamera({
        bounds: {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
          paddingTop: 140,
          paddingBottom: 260,
          paddingLeft: 60,
          paddingRight: 60,
        },
        animationDuration: 900,
      });
    } catch {
      // fallback
      const midLng = (coords[0][0] + coords[coords.length - 1][0]) / 2;
      const midLat = (coords[0][1] + coords[coords.length - 1][1]) / 2;
      cameraRef.current?.setCamera({ centerCoordinate: [midLng, midLat], zoomLevel: 13, animationDuration: 900 });
    }
  };

  const onPressDirection = async (profile?: "driving" | "walking") => {
    if (!selected) return;

    if (!TOKEN) {
      Alert.alert("Missing Mapbox token", "EXPO_PUBLIC_MAPBOX_TOKEN is not set.");
      return;
    }

    if (!myLocation) {
      Alert.alert("Location needed", "Enable location to get directions.");
      return;
    }

    setRouteLoading(true);
    try {
      const useProfile = profile ?? routeMode;
      const result = await fetchRouteFromMapbox(myLocation, [selected.lng, selected.lat], useProfile);
      setRoute({ ...result, profile: useProfile });

      const coords = (result.feature?.geometry?.coordinates ?? []) as [number, number][];
      if (coords.length >= 2) fitRoute(coords);
    } catch {
      Alert.alert("Directions unavailable", "Unable to fetch route. Try again.");
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoute = () => setRoute(null);

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
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
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
            ref={cameraRef}
            centerCoordinate={camera.centerCoordinate}
            zoomLevel={camera.zoomLevel}
            animationDuration={camera.animationDuration}
          />

          {hazardZonesGeoJSON.features.length ? (
            <MapboxGL.ShapeSource id="hazardZonesSource" shape={hazardZonesGeoJSON}>
              <MapboxGL.FillLayer
                id="hazardZonesFill"
                style={{
                  fillColor: ["get", "fillColor"] as any,
                  fillOpacity: 0.22,
                }}
              />
              <MapboxGL.LineLayer
                id="hazardZonesLine"
                style={{
                  lineColor: ["get", "lineColor"] as any,
                  lineWidth: 2,
                }}
              />
            </MapboxGL.ShapeSource>
          ) : null}


          {route ? (
            <MapboxGL.ShapeSource
              id="routeSource"
              shape={{ type: "FeatureCollection", features: [route.feature] } as any}
            >
              <MapboxGL.LineLayer
                id="routeLine"
                style={{
                  lineColor: "#3C83F6",
                  lineWidth: 5,
                  lineCap: "round",
                  lineJoin: "round",
                  ...(route.profile === "walking" ? { lineDasharray: [1.5, 1.5] } : null),
                } as any}
              />
            </MapboxGL.ShapeSource>
          ) : null}

          {myLocation ? (
            <MapboxGL.MarkerView coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.meDot} />
            </MapboxGL.MarkerView>
          ) : null}

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

              {selected ? (
                <View style={styles.actionsRow}>
                  <View style={styles.modeToggle}>
                    <Pressable
                      onPress={() => {
                        setRouteMode("driving");
                        if (route && selected && myLocation && !routeLoading) onPressDirection("driving");
                      }}
                      style={[styles.modePill, routeMode === "driving" && styles.modePillActive]}
                    >
                      <MaterialCommunityIcons
                        name="car"
                        size={15}
                        color={routeMode === "driving" ? "#111" : "#444"}
                      />
                      <Text style={[styles.modePillText, routeMode === "driving" && styles.modePillTextActive]}>
                        Drive
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setRouteMode("walking");
                        if (route && selected && myLocation && !routeLoading) onPressDirection("walking");
                      }}
                      style={[styles.modePill, routeMode === "walking" && styles.modePillActive]}
                    >
                      <MaterialCommunityIcons
                        name="walk"
                        size={15}
                        color={routeMode === "walking" ? "#111" : "#444"}
                      />
                      <Text style={[styles.modePillText, routeMode === "walking" && styles.modePillTextActive]}>
                        Walk
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => onPressDirection()}
                    disabled={routeLoading}
                    style={[styles.actionBtn, routeLoading && { opacity: 0.7 }]}
                  >
                    <Feather name="navigation" size={16} color="#111" />
                    <Text style={styles.actionBtnText}>
                      {routeLoading ? "Loading..." : "Direction"}
                    </Text>
                  </Pressable>

                  {route ? (
                    <Pressable onPress={clearRoute} style={styles.actionBtnSecondary}>
                      <Feather name="x-circle" size={16} color="#111" />
                      <Text style={styles.actionBtnText}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {route && selected ? (
                <View style={styles.routeMetaRow}>
                  <Text style={styles.routeMetaText}>
                    {(route.profile === "walking" ? "Walking" : "Driving")} • {(route.distance / 1000).toFixed(1)} km • {Math.round(route.duration / 60)} min
                  </Text>
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
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
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

  meDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },

  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  modeToggle: {
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.06)",
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  modePill: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modePillActive: {
    backgroundColor: "#FFFFFF",
  },
  modePillText: { fontSize: 12, fontWeight: "800", color: "#444" },
  modePillTextActive: { color: "#111" },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  actionBtnSecondary: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: { fontSize: 14, fontWeight: "800", color: "#111" },
  routeMetaRow: { marginTop: 10 },
  routeMetaText: { fontSize: 12, color: "#444", fontWeight: "700" },

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
