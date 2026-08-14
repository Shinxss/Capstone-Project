import MapboxGL from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
}

type Coordinate = [number, number];
type RouteGeometry = { type: "LineString"; coordinates: Coordinate[] };
type Props = { emergencyCoordinate: Coordinate | null; responderCoordinate: Coordinate | null; routeGeometry: RouteGeometry | null; lastUpdatedText: string; closed: boolean };
const DAGUPAN: Coordinate = [120.34, 16.043];

function cameraTarget(emergency: Coordinate | null, responder: Coordinate | null, route: RouteGeometry | null) {
  const coordinates = route?.coordinates?.length ? route.coordinates : [emergency, responder].filter((point): point is Coordinate => point !== null);
  if (!coordinates.length) return { center: DAGUPAN, zoom: 12 };
  const lngs = coordinates.map((point) => point[0]); const lats = coordinates.map((point) => point[1]);
  const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs); const minLat = Math.min(...lats); const maxLat = Math.max(...lats); const span = Math.max(maxLng - minLng, maxLat - minLat);
  const zoom = span > 0.1 ? 10 : span > 0.05 ? 11 : span > 0.02 ? 12 : span > 0.01 ? 13 : 14;
  return { center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as Coordinate, zoom };
}

export function TrackingMapCard({ emergencyCoordinate, responderCoordinate, routeGeometry, lastUpdatedText, closed }: Props) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [satellite, setSatellite] = useState(false);
  const zoomRef = useRef(13);
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(null);
  const target = useMemo(() => cameraTarget(emergencyCoordinate, responderCoordinate, routeGeometry), [emergencyCoordinate, responderCoordinate, routeGeometry]);
  const routeFeature = useMemo(() => routeGeometry ? { type: "Feature" as const, properties: {}, geometry: routeGeometry } : null, [routeGeometry]);
  useEffect(() => { zoomRef.current = target.zoom; cameraRef.current?.setCamera({ centerCoordinate: target.center, zoomLevel: target.zoom, animationDuration: 700 }); }, [target]);
  const showMyLocation = useCallback(async () => { const permission = await Location.requestForegroundPermissionsAsync(); if (permission.status !== "granted") { Alert.alert("Location permission needed", "Allow location access to center the map on your position."); return; } const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); const coordinate: Coordinate = [current.coords.longitude, current.coords.latitude]; setUserCoordinate(coordinate); zoomRef.current = 15; cameraRef.current?.setCamera({ centerCoordinate: coordinate, zoomLevel: 15, animationDuration: 600 }); }, []);
  const changeZoom = useCallback((delta: number) => { const next = Math.max(8, Math.min(18, zoomRef.current + delta)); zoomRef.current = next; cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 }); }, []);

  return <View style={styles.card}><MapboxGL.MapView style={styles.map} styleURL={satellite ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/streets-v12"} scaleBarEnabled={false} attributionEnabled={false} logoEnabled={false}><MapboxGL.Camera ref={cameraRef} centerCoordinate={target.center} zoomLevel={target.zoom} />{routeFeature ? <MapboxGL.ShapeSource id="trackingRouteSource" shape={routeFeature}><MapboxGL.LineLayer id="trackingRouteLine" style={{ lineColor: "#DC2626", lineWidth: 4, lineOpacity: 0.82, lineCap: "round", lineJoin: "round" }} /></MapboxGL.ShapeSource> : null}{emergencyCoordinate ? <MapboxGL.MarkerView coordinate={emergencyCoordinate} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.emergencyPulse}><View style={styles.emergencyPin}><Ionicons name="warning" size={17} color="#FFFFFF" /></View></View></MapboxGL.MarkerView> : null}{responderCoordinate ? <MapboxGL.MarkerView coordinate={responderCoordinate} anchor={{ x: 0.5, y: 0.5 }}><View style={styles.responderPin}><Ionicons name="car-sport" size={15} color="#FFFFFF" /></View></MapboxGL.MarkerView> : null}{userCoordinate ? <MapboxGL.MarkerView coordinate={userCoordinate}><View style={styles.userPin} /></MapboxGL.MarkerView> : null}</MapboxGL.MapView><View style={styles.liveBadge}><View style={[styles.liveDot, closed && styles.closedDot]} /><View><Text style={styles.liveLabel}>{closed ? "UPDATED" : "LIVE"}</Text><Text style={styles.liveTime}>Updated {lastUpdatedText}</Text></View></View><Pressable onPress={() => setSatellite((current) => !current)} style={styles.layerButton} accessibilityLabel="Change map layer"><Ionicons name="layers-outline" size={23} color="#111827" /></Pressable><Pressable onPress={() => void showMyLocation()} style={styles.locationButton} accessibilityRole="button"><Ionicons name="locate-outline" size={19} color="#334155" /><Text style={styles.locationText}>My Location</Text></Pressable><View style={styles.zoomControls}><Pressable onPress={() => changeZoom(1)} style={styles.zoomButton} accessibilityLabel="Zoom in"><Ionicons name="add" size={21} color="#111827" /></Pressable><View style={styles.zoomDivider} /><Pressable onPress={() => changeZoom(-1)} style={styles.zoomButton} accessibilityLabel="Zoom out"><Ionicons name="remove" size={21} color="#111827" /></Pressable></View></View>;
}

const styles = StyleSheet.create({
  card: { height: 330, marginHorizontal: 16, marginTop: 12, overflow: "hidden", borderRadius: 22, backgroundColor: "#E2E8F0", shadowColor: "#0F172A", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, map: { flex: 1 },
  liveBadge: { position: "absolute", left: 14, top: 14, flexDirection: "row", gap: 9, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.96)", elevation: 2 }, liveDot: { width: 10, height: 10, marginTop: 3, borderRadius: 5, backgroundColor: "#DC2626" }, closedDot: { backgroundColor: "#16A34A" }, liveLabel: { fontSize: 13, fontWeight: "900", color: "#0F172A" }, liveTime: { marginTop: 2, fontSize: 11, fontWeight: "600", color: "#64748B" },
  layerButton: { position: "absolute", right: 14, top: 14, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.96)", elevation: 3 }, locationButton: { position: "absolute", left: 14, bottom: 14, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 14, paddingHorizontal: 14, backgroundColor: "rgba(255,255,255,0.96)", elevation: 2 }, locationText: { fontSize: 13, fontWeight: "800", color: "#1E293B" },
  zoomControls: { position: "absolute", right: 14, bottom: 14, overflow: "hidden", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.96)", elevation: 2 }, zoomButton: { width: 42, height: 40, alignItems: "center", justifyContent: "center" }, zoomDivider: { height: 1, backgroundColor: "#E2E8F0", marginHorizontal: 9 },
  emergencyPulse: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(220,38,38,0.16)", borderWidth: 8, borderColor: "rgba(220,38,38,0.09)" }, emergencyPin: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#DC2626", borderWidth: 3, borderColor: "#FFFFFF" }, responderPin: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#16A34A", borderWidth: 3, borderColor: "#FFFFFF" }, userPin: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#2563EB", borderWidth: 3, borderColor: "#FFFFFF" },
});
