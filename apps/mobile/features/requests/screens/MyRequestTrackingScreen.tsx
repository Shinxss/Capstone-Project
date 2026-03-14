import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../auth/hooks/useSession";
import { usePullToRefresh } from "../../common/hooks/usePullToRefresh";
import { useRequestLiveTracking } from "../hooks/useRequestLiveTracking";
import type { TrackingLabel } from "../models/myRequests";
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

function toBarangayText(rawBarangay: unknown, rawLocationText: unknown) {
  const barangay = String(rawBarangay ?? "").trim();
  if (barangay) return barangay;

  const locationText = String(rawLocationText ?? "").trim();
  if (!locationText) return "";

  const segments = locationText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (segments.length === 0) return "";

  const looksNumeric = (value: string) => /^-?\d+(?:\.\d+)?$/.test(value);
  if (segments.length >= 2 && looksNumeric(segments[0]) && looksNumeric(segments[1])) {
    return "";
  }

  return segments[0] ?? locationText;
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
  if (normalized === "CANCELLED" || normalized === "CANCELED" || normalized === "REJECTED") {
    return { bg: "#FEE2E2", border: "#FCA5A5", text: "#B91C1C" };
  }
  return { bg: "#E0E7FF", border: "#A5B4FC", text: "#3730A3" };
}

function normalizeTrackingLabel(raw: unknown): TrackingLabel {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (normalized === "submitted") return "Submitted";
  if (normalized === "verification") return "Verification";
  if (normalized === "assigned") return "Assigned";
  if (normalized === "en route") return "En Route";
  if (normalized === "arrived") return "Arrived";
  if (normalized === "review") return "Review";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "cancelled" || normalized === "canceled" || normalized === "rejected") {
    return "Cancelled";
  }
  return "Submitted";
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
  const refreshTracking = useCallback(async () => {
    await refresh();
  }, [refresh]);
  const { refreshing: refreshingTracking, triggerRefresh: triggerRefreshTracking } =
    usePullToRefresh(refreshTracking);
  const sheetSnapPoints = useMemo(() => ["34%", "62%", "88%"], []);

  const emergencyCoordinate = useMemo(
    () => toCoordinate(data?.request?.location),
    [data?.request?.location]
  );
  const responderCoordinate = useMemo(
    () => toCoordinate(data?.tracking?.responderLocation),
    [data?.tracking?.responderLocation]
  );
  const routeGeometry = data?.tracking?.routeGeometry ?? null;
  const trackingLabel = useMemo(
    () => normalizeTrackingLabel(data?.tracking?.label),
    [data?.tracking?.label]
  );
  const requestStatus = useMemo(
    () => String(data?.request?.status ?? "").trim().toUpperCase(),
    [data?.request?.status]
  );
  const rejectionReason = useMemo(
    () => String(data?.request?.rejectionReason ?? "").trim(),
    [data?.request?.rejectionReason]
  );
  const isClosedRequest = trackingLabel === "Resolved" || trackingLabel === "Cancelled";
  const isCancelledRequest = trackingLabel === "Cancelled";
  const isRejectedRequest = isCancelledRequest && requestStatus !== "CANCELLED";
  const statusMessage = useMemo(() => {
    if (isRejectedRequest) return "Request rejected by LGU.";
    if (isCancelledRequest) return "Request cancelled.";
    return formatEtaText(data?.tracking?.etaSeconds, trackingLabel);
  }, [data?.tracking?.etaSeconds, isCancelledRequest, isRejectedRequest, trackingLabel]);
  const headline = useMemo(() => {
    if (isRejectedRequest) return "Request Rejected";
    if (isCancelledRequest) return "Request Cancelled";
    return formatTrackingHeadline(trackingLabel);
  }, [isCancelledRequest, isRejectedRequest, trackingLabel]);
  const statusLabelText = useMemo(() => (isRejectedRequest ? "Rejected" : trackingLabel), [isRejectedRequest, trackingLabel]);
  const reasonText = useMemo(() => {
    if (!isRejectedRequest) return "";
    return rejectionReason || "No rejection reason provided by LGU.";
  }, [isRejectedRequest, rejectionReason]);
  const pillColors = useMemo(() => statusPillStyles(trackingLabel), [trackingLabel]);
  const responderName = useMemo(() => {
    const name = String(data?.tracking?.responder?.name ?? "").trim();
    if (name) return name;
    if (trackingLabel === "Submitted" || trackingLabel === "Assigned") return "Waiting for responder";
    if (trackingLabel === "Cancelled") return "No active responder";
    if (trackingLabel === "Resolved") return "Response completed";
    return "Responder details unavailable";
  }, [data?.tracking?.responder?.name, trackingLabel]);
  const locationText = useMemo(() => {
    const barangayText = toBarangayText(data?.request?.barangay, data?.request?.locationText);
    if (barangayText) return barangayText;
    return toLocationText(emergencyCoordinate);
  }, [data?.request?.barangay, data?.request?.locationText, emergencyCoordinate]);
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
      <View style={styles.safe}>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Sign in required</Text>
          <Text style={styles.stateSub}>Please sign in to access request tracking.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.actionBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!requestId) {
    return (
      <View style={styles.safe}>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Invalid request</Text>
          <Text style={styles.stateSub}>Missing request id.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.back()}>
            <Text style={styles.actionBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={styles.safe}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color="#DC2626" />
          <Text style={styles.stateSub}>Loading tracking details...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.safe}>
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Tracking unavailable</Text>
          <Text style={styles.stateSub}>{error ?? "Unable to load tracking details."}</Text>
          <Pressable style={styles.actionBtn} onPress={() => void refreshTracking()}>
            <Text style={styles.actionBtnText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerBackButton}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color="#18181B" />
          </Pressable>
          <Text style={styles.headerTitle}>Request Tracking</Text>
        </View>
      </View>

      <View style={styles.mapStage}>
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
            <Text style={styles.mapHintText}>
              {isCancelledRequest ? "Request was cancelled." : "Waiting for responder location..."}
            </Text>
          </View>
        ) : null}

        <BottomSheet
          index={0}
          snapPoints={sheetSnapPoints}
          enablePanDownToClose={false}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingTracking}
                onRefresh={triggerRefreshTracking}
                tintColor="#DC2626"
              />
            }
          >
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
                <Text style={[styles.statusPillText, { color: pillColors.text }]}>{statusLabelText}</Text>
              </View>

              <Text style={styles.summaryHeadline}>{headline}</Text>
              <Text style={styles.summaryType}>{requestTypeText}</Text>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={styles.infoRowText}>{locationText}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name={isCancelledRequest || isRejectedRequest ? "alert-circle-outline" : "time-outline"}
                  size={18}
                  color={isCancelledRequest || isRejectedRequest ? "#B91C1C" : "#D97706"}
                />
                <Text
                  style={[
                    styles.infoRowText,
                    isCancelledRequest || isRejectedRequest ? styles.infoRowTextDanger : styles.infoRowTextAccent,
                  ]}
                >
                  {statusMessage}
                </Text>
              </View>

              {isRejectedRequest ? (
                <View style={styles.rejectionReasonWrap}>
                  <Text style={styles.rejectionReasonTitle}>Reason from LGU</Text>
                  <Text style={styles.rejectionReasonText}>{reasonText}</Text>
                </View>
              ) : null}

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
              <Text style={[styles.liveText, isClosedRequest ? styles.liveTextClosed : null]}>
                {isClosedRequest ? `Updated ${lastUpdatedAgoText}` : `LIVE updated ${lastUpdatedAgoText}`}
              </Text>

              {responderPhone && !isClosedRequest ? (
                <Pressable style={styles.callBtn} onPress={() => void onCallResponder()}>
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={styles.callBtnText}>Call Responder</Text>
                </Pressable>
              ) : null}
            </View>

            {!isCancelledRequest ? (
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
            ) : null}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerSection: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  mapStage: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  sheetBg: {
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  sheetHandle: {
    backgroundColor: "rgba(0,0,0,0.22)",
    width: 42,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
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
  infoRowTextDanger: {
    color: "#B91C1C",
    fontWeight: "800",
  },
  rejectionReasonWrap: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rejectionReasonTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991B1B",
  },
  rejectionReasonText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#7F1D1D",
    fontWeight: "600",
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
  liveTextClosed: {
    color: "#6B7280",
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
  map: {
    flex: 1,
  },
  mapHint: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 260,
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
