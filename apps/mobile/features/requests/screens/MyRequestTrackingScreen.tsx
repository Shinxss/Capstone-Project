import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { useLocalSearchParams, router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../auth/hooks/useSession";
import { useRequestLiveTracking } from "../hooks/useRequestLiveTracking";
import { formatEtaText, formatTrackingHeadline } from "../utils/formatters";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const DAGUPAN: [number, number] = [120.34, 16.043];

if (TOKEN) {
  MapboxGL.setAccessToken(TOKEN);
  MapboxGL.setTelemetryEnabled(false);
}

function toCoordinate(point?: { lng: number; lat: number } | null): [number, number] | null {
  if (!point) return null;
  if (!Number.isFinite(point.lng) || !Number.isFinite(point.lat)) return null;
  return [point.lng, point.lat];
}

function formatRequestType(raw: string) {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (!normalized) return "Emergency Request";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocationText(coord: [number, number] | null) {
  if (!coord) return "Location unavailable";
  return `${coord[1].toFixed(5)}, ${coord[0].toFixed(5)}`;
}

function statusPillStyles(label: string) {
  const normalized = String(label ?? "").toUpperCase();
  if (normalized === "RESOLVED") {
    return { bg: "#DCFCE7", border: "#86EFAC", text: "#166534" };
  }
  if (normalized === "ARRIVED") {
    return { bg: "#DBEAFE", border: "#93C5FD", text: "#1D4ED8" };
  }
  if (normalized === "EN ROUTE") {
    return { bg: "#FEF3C7", border: "#FCD34D", text: "#B45309" };
  }
  if (normalized === "CANCELLED") {
    return { bg: "#FEE2E2", border: "#FCA5A5", text: "#B91C1C" };
  }
  return { bg: "#E0E7FF", border: "#A5B4FC", text: "#3730A3" };
}

export function MyRequestTrackingScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const requestId = Array.isArray(rawId) ? String(rawId[0] ?? "") : String(rawId ?? "");
  const { isUser } = useSession();
  const isFocused = useIsFocused();
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const { data, loading, error, refresh, lastUpdatedAgoText } = useRequestLiveTracking(requestId, {
    pollMs: 6000,
    enabled: isUser && isFocused && Boolean(requestId),
  });

  const emergencyCoordinate = useMemo(
    () => toCoordinate(data?.request?.location),
    [data?.request?.location]
  );
  const responderCoordinate = useMemo(
    () => toCoordinate(data?.tracking?.responderLocation),
    [data?.tracking?.responderLocation]
  );
  const routeGeometry = data?.tracking?.routeGeometry ?? null;
  const trackingLabel = data?.tracking?.label ?? "Submitted";
  const etaText = formatEtaText(data?.tracking?.etaSeconds, trackingLabel);
  const headline = formatTrackingHeadline(trackingLabel);
  const pillColors = useMemo(() => statusPillStyles(trackingLabel), [trackingLabel]);
  const responderName = useMemo(() => {
    const name = String(data?.tracking?.responder?.name ?? "").trim();
    if (name) return name;
    if (trackingLabel === "Submitted" || trackingLabel === "Assigned") return "Waiting for responder";
    return "Responder details unavailable";
  }, [data?.tracking?.responder?.name, trackingLabel]);
  const locationText = useMemo(() => toLocationText(emergencyCoordinate), [emergencyCoordinate]);
  const createdAtText = useMemo(() => formatCreatedAt(data?.request?.createdAt ?? ""), [data?.request?.createdAt]);
  const detailsText = useMemo(() => String(data?.request?.notes ?? "").trim(), [data?.request?.notes]);
  const requestTypeText = useMemo(() => formatRequestType(data?.request?.type ?? ""), [data?.request?.type]);
  const responderPhone = useMemo(
    () => String(data?.tracking?.responder?.phone ?? "").trim(),
    [data?.tracking?.responder?.phone]
  );

  useEffect(() => {
    if (!isFocused || !cameraRef.current || !emergencyCoordinate) return;

    const points: [number, number][] = [];
    if (Array.isArray(routeGeometry?.coordinates) && routeGeometry.coordinates.length >= 2) {
      points.push(...routeGeometry.coordinates);
    } else {
      points.push(emergencyCoordinate);
      if (responderCoordinate) points.push(responderCoordinate);
    }

    if (points.length >= 2) {
      let minLng = points[0][0];
      let maxLng = points[0][0];
      let minLat = points[0][1];
      let maxLat = points[0][1];

      for (const [lng, lat] of points) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }

      (cameraRef.current as any)?.setCamera({
        bounds: {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat],
          paddingTop: 70,
          paddingBottom: 70,
          paddingLeft: 45,
          paddingRight: 45,
        },
        animationDuration: 700,
      });
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: emergencyCoordinate,
      zoomLevel: 14,
      animationDuration: 700,
    });
  }, [emergencyCoordinate, isFocused, responderCoordinate, routeGeometry?.coordinates]);

  const onCallResponder = useCallback(async () => {
    const phone = responderPhone;
    if (!phone) return;

    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Call unavailable", "Your device cannot open the phone dialer.");
      return;
    }

    await Linking.openURL(url);
  }, [responderPhone]);

  if (!isUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Sign in required</Text>
          <Text style={styles.stateSub}>Please sign in to access request tracking.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.actionBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!requestId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Invalid request</Text>
          <Text style={styles.stateSub}>Missing request id.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.back()}>
            <Text style={styles.actionBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color="#DC2626" />
          <Text style={styles.stateSub}>Loading tracking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Tracking unavailable</Text>
          <Text style={styles.stateSub}>{error ?? "Unable to load tracking details."}</Text>
          <Pressable style={styles.actionBtn} onPress={() => void refresh()}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Request Tracking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: pillColors.bg,
                borderColor: pillColors.border,
              },
            ]}
          >
            <Text style={[styles.statusPillText, { color: pillColors.text }]}>{trackingLabel}</Text>
          </View>

          <Text style={styles.summaryHeadline}>{headline}</Text>
          <Text style={styles.summaryType}>{requestTypeText}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Text style={styles.infoRowText}>{locationText}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#D97706" />
            <Text style={[styles.infoRowText, styles.infoRowTextAccent]}>{etaText}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#6B7280" />
            <Text style={styles.infoRowText}>Responder: {responderName}</Text>
          </View>

          {responderPhone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <Text style={styles.infoRowText}>{responderPhone}</Text>
            </View>
          ) : null}

          {detailsText ? (
            <Text style={styles.detailsText} numberOfLines={3}>
              {detailsText}
            </Text>
          ) : null}

          <Text style={styles.metaText}>Reference {data.request.referenceNumber}</Text>
          <Text style={styles.metaText}>Created {createdAtText}</Text>
          <Text style={styles.liveText}>LIVE updated {lastUpdatedAgoText}</Text>

          {responderPhone ? (
            <Pressable style={styles.callBtn} onPress={() => void onCallResponder()}>
              <Ionicons name="call" size={15} color="#FFFFFF" />
              <Text style={styles.callBtnText}>Call Responder</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <MapboxGL.MapView
              style={styles.map}
              styleURL={MapboxGL.StyleURL.Street}
              scaleBarEnabled={false}
              attributionEnabled={false}
              logoEnabled={false}
            >
              <MapboxGL.Camera
                ref={cameraRef}
                centerCoordinate={emergencyCoordinate ?? DAGUPAN}
                zoomLevel={13}
              />

              {routeGeometry &&
              Array.isArray(routeGeometry.coordinates) &&
              routeGeometry.coordinates.length >= 2 ? (
                <MapboxGL.ShapeSource
                  id="trackingRouteSource"
                  shape={{
                    type: "Feature",
                    properties: {},
                    geometry: routeGeometry as any,
                  }}
                >
                  <MapboxGL.LineLayer
                    id="trackingRouteLine"
                    style={{
                      lineColor: "#2563EB",
                      lineWidth: 5,
                      lineOpacity: 0.85,
                    }}
                  />
                </MapboxGL.ShapeSource>
              ) : null}

              {emergencyCoordinate ? (
                <MapboxGL.MarkerView coordinate={emergencyCoordinate} anchor={{ x: 0.5, y: 1 }}>
                  <View style={styles.emergencyPin}>
                    <Ionicons name="warning" size={14} color="#FFFFFF" />
                  </View>
                </MapboxGL.MarkerView>
              ) : null}

              {responderCoordinate ? (
                <MapboxGL.MarkerView coordinate={responderCoordinate} anchor={{ x: 0.5, y: 1 }}>
                  <View style={styles.responderPin}>
                    <Ionicons name="person" size={14} color="#FFFFFF" />
                  </View>
                </MapboxGL.MarkerView>
              ) : null}
            </MapboxGL.MapView>

            {!responderCoordinate ? (
              <View style={styles.mapHint}>
                <Text style={styles.mapHintText}>Waiting for responder location...</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Progress</Text>
          {data.timeline.steps.map((step, index) => {
            const isActive = index <= data.timeline.activeStepIndex;
            return (
              <View key={`${step}-${index}`} style={styles.timelineRow}>
                <View style={[styles.timelineDot, isActive ? styles.timelineDotActive : null]} />
                <Text style={[styles.timelineText, isActive ? styles.timelineTextActive : null]}>{step}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F5F5F5",
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  summaryHeadline: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
  },
  summaryType: {
    marginTop: 4,
    fontSize: 31,
    fontWeight: "500",
    color: "#111827",
  },
  infoRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  infoRowText: {
    flex: 1,
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "600",
  },
  infoRowTextAccent: {
    color: "#D97706",
    fontWeight: "800",
  },
  detailsText: {
    marginTop: 10,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  metaText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
  },
  liveText: {
    marginTop: 4,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "800",
  },
  callBtn: {
    marginTop: 12,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
  },
  callBtnText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  mapContainer: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  map: {
    flex: 1,
  },
  mapHint: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(17,24,39,0.66)",
  },
  mapHintText: {
    color: "#F9FAFB",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
  },
  emergencyPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  responderPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timelineTitle: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  timelineRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },
  timelineDotActive: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
  },
  timelineText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  timelineTextActive: {
    color: "#111827",
    fontWeight: "800",
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  stateSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  actionBtn: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
