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
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapboxGL, { Logger } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import { useMapStyle } from "../../features/map/hooks/useMapStyle";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Droplets, Construction, Flame, Mountain, ShieldAlert } from "lucide-react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { api } from "../../lib/api";
import { fetchEmergencyMapReports } from "../../features/emergency/services/emergencyApi";
import { useAuth } from "../../features/auth/AuthProvider";
import { EmergencyBottomSheetContainer } from "../../features/map/components/EmergencyBottomSheetContainer";
import { useEmergencyBottomSheet } from "../../features/map/hooks/useEmergencyBottomSheet";
import type { Emergency, EmergencyType } from "../../features/map/models/map.types";
import { useDevWeatherOverride } from "../../features/weather/hooks/useDevWeatherOverride";
import { DevWeatherOverrideOverlay } from "../../features/weather/components/DevWeatherOverrideOverlay";
import { useDevLocationOverride } from "../../features/location/hooks/useDevLocationOverride";
import { DevLocationOverrideOverlay } from "../../features/location/components/DevLocationOverrideOverlay";
import { getEffectiveLocation } from "../../features/location/utils/getEffectiveLocation";

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

const HAZARD_LEGEND_ITEMS = [
  { key: "FLOODED", label: "Flooded", color: hazardColorForType("FLOODED").fill, icon: Droplets },
  { key: "ROAD_CLOSED", label: "Road closed", color: hazardColorForType("ROAD_CLOSED").fill, icon: Construction },
  { key: "FIRE_RISK", label: "Fire risk", color: hazardColorForType("FIRE_RISK").fill, icon: Flame },
  { key: "LANDSLIDE", label: "Landslide", color: hazardColorForType("LANDSLIDE").fill, icon: Mountain },
  { key: "UNSAFE", label: "Unsafe", color: hazardColorForType("UNSAFE").fill, icon: ShieldAlert },
] as const;

const MAP_TYPE_OPTIONS = [
  { key: "streets", label: "Default", stylePath: "mapbox/streets-v12" },
  { key: "satellite", label: "Satellite", stylePath: "mapbox/satellite-streets-v12" },
  { key: "dark", label: "Dark", stylePath: "mapbox/dark-v11" },
] as const;

const EMERGENCY_LEGEND_ITEMS: EmergencyType[] = [
  "SOS",
  "Flood",
  "Fire",
  "Typhoon",
  "Earthquake",
  "Collapse",
];

// MaterialCommunityIcons mapping
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
 * Big pulse wave (RN Animated version of your CSS)
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
  const isFocused = useIsFocused();
  const { mode, user } = useAuth();
  const [query, setQuery] = useState("");
  const { key: styleKey, styleURL, setKey } = useMapStyle("streets");
  const {
    override: devWx,
    patch: patchDevWx,
    clear: clearDevWx,
  } = useDevWeatherOverride();
  const {
    override: devLoc,
    patch: patchDevLoc,
    clear: clearDevLoc,
  } = useDevLocationOverride();
  const normalizedRole = useMemo(() => String(user?.role ?? "").trim().toUpperCase(), [user?.role]);
  const canViewEmergencies = mode === "authed" && normalizedRole !== "COMMUNITY";

  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [reports, setReports] = useState<Emergency[]>([]);
  const devLocationEnabled = __DEV__ && devLoc.enabled;
  const devWeatherEnabled = __DEV__ && devWx.enabled;
  const effectiveDevLocation = useMemo(
    () => ({
      ...devLoc,
      enabled: devLocationEnabled,
    }),
    [devLoc, devLocationEnabled]
  );
  const gpsLocation = useMemo(
    () =>
      myLocation
        ? {
            lng: myLocation[0],
            lat: myLocation[1],
          }
        : null,
    [myLocation]
  );
  const effectiveLocation = useMemo(
    () => getEffectiveLocation(effectiveDevLocation, gpsLocation),
    [effectiveDevLocation, gpsLocation]
  );
  const effectiveUserLocation = useMemo<[number, number] | null>(() => {
    if (devLocationEnabled) {
      return [effectiveLocation.lng, effectiveLocation.lat];
    }
    return myLocation;
  }, [devLocationEnabled, effectiveLocation.lat, effectiveLocation.lng, myLocation]);

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
    if (!canViewEmergencies) {
      setReports([]);
      return;
    }

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
            images: [],
            location: {
              lng: item.location.coords.longitude,
              lat: item.location.coords.latitude,
              label: item.location.label,
            },
            updatedAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "just now",
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
  }, [canViewEmergencies]);

  // Keep current location for routing (Direction button)
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
  const hasCenteredOnGpsRef = useRef(false);

  useEffect(() => {
    if (!isFocused) return;
    if (!devLocationEnabled) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [effectiveLocation.lng, effectiveLocation.lat],
      zoomLevel: 13,
      animationDuration: 900,
    });
  }, [devLocationEnabled, effectiveLocation.lat, effectiveLocation.lng, isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    if (devLocationEnabled) return;
    if (!myLocation) return;
    if (hasCenteredOnGpsRef.current) return;

    hasCenteredOnGpsRef.current = true;
    cameraRef.current?.setCamera({
      centerCoordinate: myLocation,
      zoomLevel: 13,
      animationDuration: 900,
    });
  }, [devLocationEnabled, isFocused, myLocation]);

  // draggable "Google Maps-ish" sheet
  const layersSheetRef = useRef<BottomSheet>(null);
  const layersSnapPoints = useMemo(() => ["42%", "72%"], []);

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

  const resolveStartLocation = async (): Promise<{ lng: number; lat: number } | null> => {
    if (devLocationEnabled) {
      const effective = getEffectiveLocation(effectiveDevLocation, gpsLocation);
      return {
        lng: effective.lng,
        lat: effective.lat,
      };
    }

    if (myLocation) {
      return {
        lng: myLocation[0],
        lat: myLocation[1],
      };
    }

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("Location needed", "Turn on location services to get directions.");
        return null;
      }

      const permission = await Location.getForegroundPermissionsAsync();
      let status = permission.status;

      if (status !== "granted" && permission.canAskAgain) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== "granted") {
        Alert.alert("Location needed", "Allow location permission to get directions.");
        return null;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: [number, number] = [current.coords.longitude, current.coords.latitude];
      setMyLocation(coords);

      const effective = getEffectiveLocation(effectiveDevLocation, {
        lng: coords[0],
        lat: coords[1],
      });
      return {
        lng: effective.lng,
        lat: effective.lat,
      };
    } catch {
      Alert.alert("Location needed", "Unable to read your current location right now.");
      return null;
    }
  };

  const emergencySheet = useEmergencyBottomSheet({
    resolveOrigin: resolveStartLocation,
    getWeatherContext: () =>
      devWeatherEnabled
        ? {
            rainfall_mm: devWx.rainfall_mm,
            is_raining: devWx.is_raining,
          }
        : null,
  });
  const inactiveRouteAlternatives = useMemo(
    () =>
      emergencySheet.routeAlternatives.filter(
        (_route, index) => index !== emergencySheet.selectedRouteIndex
      ),
    [emergencySheet.routeAlternatives, emergencySheet.selectedRouteIndex]
  );

  useEffect(() => {
    if (canViewEmergencies) return;
    emergencySheet.closeSheet();
  }, [canViewEmergencies, emergencySheet.closeSheet]);

  useEffect(() => {
    if (emergencySheet.sheetMode !== "directions") return;
    const coords = emergencySheet.route?.geometry.coordinates ?? [];
    if (coords.length >= 2) {
      fitRoute(coords);
    }
  }, [emergencySheet.route, emergencySheet.sheetMode]);

  const openSheet = (emergency: Emergency) => {
    if (!canViewEmergencies) return;
    layersSheetRef.current?.close();
    emergencySheet.openEmergency(emergency);
  };

  const openLayersSheet = () => {
    emergencySheet.closeSheet();
    requestAnimationFrame(() => layersSheetRef.current?.snapToIndex(1));
  };

  // chips (replace old status pill)
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
          onDidFinishLoadingStyle={() => console.log("[Mapbox] style loaded", styleKey)}
           onMapLoadingError={() => {
            console.log("[Mapbox] map loading error");
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

          {emergencySheet.route ? (
            <>
              {inactiveRouteAlternatives.length ? (
                <MapboxGL.ShapeSource
                  id="routeAlternativeSource"
                  shape={
                    {
                      type: "FeatureCollection",
                      features: inactiveRouteAlternatives.map((candidate, index) => ({
                        type: "Feature",
                        properties: { id: `alt-${index}` },
                        geometry: candidate.geometry,
                      })),
                    } as any
                  }
                >
                  <MapboxGL.LineLayer
                    id="routeAlternativeLine"
                    style={{
                      lineColor: "#94A3B8",
                      lineOpacity: 0.88,
                      lineWidth: 5,
                      lineCap: "round",
                      lineJoin: "round",
                    } as any}
                  />
                </MapboxGL.ShapeSource>
              ) : null}

              <MapboxGL.ShapeSource
                id="routeSource"
                shape={
                  {
                    type: "FeatureCollection",
                    features: [
                      {
                        type: "Feature",
                        properties: {},
                        geometry: emergencySheet.route.geometry,
                      },
                    ],
                  } as any
                }
              >
                <MapboxGL.LineLayer
                  id="routeLine"
                  style={{
                    lineColor: "#1D4ED8",
                    lineOpacity: 0.95,
                    lineWidth: 7,
                    lineCap: "round",
                    lineJoin: "round",
                  } as any}
                />
              </MapboxGL.ShapeSource>
            </>
          ) : null}

          {effectiveUserLocation ? (
            <MapboxGL.MarkerView coordinate={effectiveUserLocation} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.meDot} />
            </MapboxGL.MarkerView>
          ) : null}

          {canViewEmergencies
            ? filteredReports.map((r) => (
                <MapboxGL.MarkerView
                  key={r.id}
                  coordinate={[r.location.lng, r.location.lat]}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <Pressable onPress={() => openSheet(r)} style={{ padding: 2 }}>
                    <PulseMarker type={r.type} />
                  </Pressable>
                </MapboxGL.MarkerView>
              ))
            : null}
        </MapboxGL.MapView>

        {/* Google-Maps-like top UI */}
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

              {/* Profile avatar */}
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

            <View style={styles.layerControlRow}>
              <Pressable onPress={openLayersSheet} style={styles.layerControlBtn} hitSlop={10}>
                <Feather name="layers" size={20} color="#0F172A" />
              </Pressable>
            </View>
          </View>
        </View>

        <DevWeatherOverrideOverlay
          override={devWx}
          onPatch={patchDevWx}
          onClear={clearDevWx}
          lastUsed={emergencySheet.risk?.usedWeather ?? null}
          top={Math.max(110, insets.top + 86)}
        />

        <DevLocationOverrideOverlay
          override={devLoc}
          onPatch={patchDevLoc}
          onClear={clearDevLoc}
          top={Math.max(164, insets.top + 140)}
        />

        <EmergencyBottomSheetContainer controller={emergencySheet} />

        <BottomSheet
          ref={layersSheetRef}
          index={-1}
          snapPoints={layersSnapPoints}
          enablePanDownToClose
          backgroundStyle={styles.layersSheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView style={styles.layersSheetContent}>
            <View style={styles.layersHeaderRow}>
              <Text style={styles.layersTitle}>Map type</Text>
              <Pressable onPress={() => layersSheetRef.current?.close()} style={styles.layersCloseBtn} hitSlop={10}>
                <Feather name="x" size={18} color="#111827" />
              </Pressable>
            </View>

            <View style={styles.mapTypeRow}>
              {MAP_TYPE_OPTIONS.map((option) => {
                const selectedType = styleKey === option.key;
                const previewUri = TOKEN
                  ? `https://api.mapbox.com/styles/v1/${option.stylePath}/static/${DAGUPAN[0]},${DAGUPAN[1]},12,0/180x180?access_token=${TOKEN}&logo=false&attribution=false`
                  : null;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setKey(option.key)}
                    style={styles.mapTypeItem}
                  >
                    <View style={[styles.mapTypeThumb, selectedType && styles.mapTypeThumbActive]}>
                      {previewUri ? (
                        <Image source={{ uri: previewUri }} style={styles.mapTypeThumbImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.mapTypeThumbFallback}>
                          <Text style={styles.mapTypeThumbFallbackText}>{option.label}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.mapTypeLabel, selectedType && styles.mapTypeLabelActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.layersDivider} />

            <Text style={styles.layersLegendTitle}>Map Legend</Text>

            <View style={styles.layersLegendColumns}>
              <View
                style={[
                  styles.layersLegendColumn,
                  !canViewEmergencies && styles.layersLegendColumnFull,
                ]}
              >
                <Text style={styles.layersLegendSection}>Hazard zones</Text>
                <View style={styles.layersLegendList}>
                  {HAZARD_LEGEND_ITEMS.map((item) => {
                    const HazardIcon = item.icon;
                    return (
                      <View key={item.key} style={styles.layersLegendRow}>
                        <View
                          style={[
                            styles.layersHazardSwatch,
                            {
                              backgroundColor: item.color,
                              borderColor: item.color,
                            },
                          ]}
                        >
                          <HazardIcon size={10} color="#FFFFFF" strokeWidth={2.3} />
                        </View>
                        <Text style={styles.layersLegendText}>{item.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {canViewEmergencies ? (
                <View style={styles.layersLegendColumn}>
                  <Text style={styles.layersLegendSection}>Emergencies</Text>
                  <View style={styles.layersLegendList}>
                    {EMERGENCY_LEGEND_ITEMS.map((type) => {
                      const color = colorForType(type);
                      return (
                        <View key={type} style={styles.layersLegendRow}>
                          <View style={[styles.layersEmergencySwatch, { borderColor: color }]}>
                            <MaterialCommunityIcons name={mciForType(type) as any} size={11} color={color} />
                          </View>
                          <Text style={styles.layersLegendText}>{type}</Text>
                        </View>
                      );
                    })}
                  </View>
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

  // top UI container
  topUi: {
    paddingHorizontal: 12,
  },

  // White search bar
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
  layerControlRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  layerControlBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  layersSheetBg: {
    backgroundColor: "#FFFFFF",
  },
  layersSheetContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
  },
  layersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  layersTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
  },
  layersCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,24,39,0.06)",
  },
  mapTypeRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  mapTypeItem: {
    flex: 1,
    alignItems: "center",
  },
  mapTypeThumb: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "transparent",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  mapTypeThumbActive: {
    borderColor: "#0EA5E9",
  },
  mapTypeThumbImage: {
    width: "100%",
    height: "100%",
  },
  mapTypeThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  mapTypeThumbFallbackText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  mapTypeLabel: {
    marginTop: 10,
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  mapTypeLabelActive: {
    color: "#0EA5E9",
    fontWeight: "700",
  },
  layersDivider: {
    height: 1,
    backgroundColor: "rgba(15,23,42,0.12)",
    marginTop: 18,
    marginBottom: 16,
  },
  layersLegendTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  layersLegendColumns: {
    marginTop: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  layersLegendColumn: {
    width: "48%",
  },
  layersLegendColumnFull: {
    width: "100%",
  },
  layersLegendSection: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  layersLegendList: {
    marginTop: 8,
    gap: 8,
  },
  layersLegendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  layersHazardSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  layersEmergencySwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#FFFFFF",
  },
  layersLegendText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },

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
  aiActionRow: { marginTop: 10 },
  aiRouteBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  aiRouteBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  routeMetaRow: { marginTop: 10 },
  routeMetaText: { fontSize: 12, color: "#444", fontWeight: "700" },
  routeMetaSubText: { marginTop: 4, fontSize: 12, color: "#111", fontWeight: "700" },
  routeMetaMetricText: { marginTop: 4, fontSize: 12, color: "#0F172A", fontWeight: "800" },
  routeRiskLegendText: { marginTop: 4, fontSize: 11, color: "#64748B", fontWeight: "600" },
  routeRiskCurrentText: { marginTop: 2, fontSize: 12, color: "#111", fontWeight: "700" },
  routeRiskCurrentValue: { fontSize: 12, fontWeight: "800" },
  routeRiskReasonText: { marginTop: 4, fontSize: 11, color: "#334155", fontWeight: "600" },

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
