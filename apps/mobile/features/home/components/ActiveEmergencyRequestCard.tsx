import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  isActiveRequestTrackingLabel,
  type MyRequestSummary,
  type MyRequestTrackingDTO,
} from "../../requests/models/myRequests";
import { TrackingMapCard } from "../../requests/tracking/components/TrackingMapCard";
import {
  isClosedTrackingStatus,
  normalizeTrackingLabel,
  toCoordinate,
} from "../../requests/tracking/utils/tracking.utils";
import {
  formatEtaText,
  formatTrackingHeadline,
} from "../../requests/utils/formatters";

type Props = {
  request: MyRequestSummary;
  tracking?: MyRequestTrackingDTO | null;
  onPressTracking?: () => void;
};

export function ActiveEmergencyRequestCard({
  request,
  tracking,
  onPressTracking,
}: Props) {
  const currentTracking = tracking?.request.id === request.id ? tracking : null;
  const trackingLabel = useMemo(
    () => normalizeTrackingLabel(currentTracking?.tracking.label ?? request.trackingStatus),
    [currentTracking?.tracking.label, request.trackingStatus]
  );
  const emergencyCoordinate = useMemo(
    () => toCoordinate(currentTracking?.request.location ?? request.location),
    [currentTracking?.request.location, request.location]
  );
  const responderCoordinate = useMemo(
    () => toCoordinate(currentTracking?.tracking.responderLocation),
    [currentTracking?.tracking.responderLocation]
  );
  const statusLabel = formatTrackingHeadline(trackingLabel);
  const etaText = formatEtaText(
    currentTracking?.tracking.etaSeconds ?? request.etaSeconds ?? null,
    trackingLabel
  );
  const locationLabel =
    String(currentTracking?.request.barangay ?? "").trim() ||
    String(currentTracking?.request.locationText ?? "").trim() ||
    String(request.locationText ?? "").trim() ||
    "Location unavailable";
  const responderPhone = String(currentTracking?.tracking.responder?.phone ?? "").trim();
  const canCallResponder =
    Boolean(currentTracking?.tracking.responder) &&
    Boolean(responderPhone) &&
    !isClosedTrackingStatus(trackingLabel);

  const callResponder = useCallback(() => {
    if (!responderPhone) return;

    Alert.alert("Call responder?", `Open your phone dialer with ${responderPhone}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open Dialer",
        onPress: () => {
          void Linking.openURL(`tel:${responderPhone}`);
        },
      },
    ]);
  }, [responderPhone]);

  if (!isActiveRequestTrackingLabel(trackingLabel)) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="alert-circle-outline" size={21} color="#DC2626" />
        </View>
        <Text style={styles.title} maxFontSizeMultiplier={1.15}>
          Active Emergency Request
        </Text>
      </View>

      <View style={styles.statusBar}>
        <Text numberOfLines={1} style={styles.statusText} maxFontSizeMultiplier={1.15}>
          {statusLabel}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        {emergencyCoordinate ? (
          <TrackingMapCard
            emergencyCoordinate={emergencyCoordinate}
            responderCoordinate={responderCoordinate}
            routeGeometry={currentTracking?.tracking.routeGeometry ?? null}
            mode="preview"
          />
        ) : (
          <View style={styles.mapFallback}>
            <Ionicons name="location-outline" size={24} color="#94A3B8" />
            <Text style={styles.mapFallbackText}>Location preview unavailable</Text>
          </View>
        )}
      </View>

      <Text style={styles.eta} maxFontSizeMultiplier={1.2}>
        {etaText}
      </Text>

      <View style={styles.actionRow}>
        {canCallResponder ? (
          <Pressable
            onPress={callResponder}
            accessibilityRole="button"
            accessibilityLabel="Call assigned responder"
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="call" size={19} color="#475569" />
            <Text numberOfLines={1} style={styles.actionText} maxFontSizeMultiplier={1.1}>
              Call Responder
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onPressTracking}
          disabled={!onPressTracking}
          accessibilityRole="button"
          accessibilityLabel={`View emergency location: ${locationLabel}`}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && onPressTracking ? styles.buttonPressed : null,
          ]}
        >
          <Ionicons name="location" size={20} color="#475569" />
          <Text numberOfLines={1} style={styles.locationText} maxFontSizeMultiplier={1.1}>
            {locationLabel}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onPressTracking}
        disabled={!onPressTracking}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.trackingButton,
          pressed && onPressTracking ? styles.buttonPressed : null,
        ]}
      >
        <Text style={styles.trackingButtonText} maxFontSizeMultiplier={1.15}>
          View Tracking Details
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#075DAA"
          style={styles.trackingChevron}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  header: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  statusBar: {
    minHeight: 42,
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 9,
    justifyContent: "center",
    backgroundColor: "#E3262E",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  mapWrap: {
    height: 158,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
  },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#F1F5F9",
  },
  mapFallbackText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  eta: {
    marginTop: 10,
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  actionRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 9,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D7DCE2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    flexShrink: 1,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "700",
  },
  locationText: {
    flex: 1,
    minWidth: 0,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "700",
  },
  trackingButton: {
    height: 50,
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D7DCE2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trackingButtonText: {
    color: "#075DAA",
    fontSize: 15,
    fontWeight: "800",
  },
  trackingChevron: {
    position: "absolute",
    right: 14,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
