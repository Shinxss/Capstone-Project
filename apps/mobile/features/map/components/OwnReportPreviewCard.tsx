import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import { getMobileEmergencyVisual, mobileEmergencyTitle } from "../../emergency/constants/emergencyVisuals";
import type { EmergencyMarkerPlacement } from "../models/map.types";

type OwnReportPreviewCardProps = {
  marker: EmergencyMarkerPlacement;
  onViewDetails: (emergencyId: string) => void;
  onClose: () => void;
  bottomOffset?: number;
};

function formatReportedTime(reportedAt?: string): string {
  if (!reportedAt) return "Reported recently";
  const date = new Date(reportedAt);
  if (isNaN(date.getTime())) return "Reported recently";
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSeconds < 60) return "Reported just now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `Reported ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Reported ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Reported ${days}d ago`;
}

function getStatusDetails(status?: string, isDark: boolean = false) {
  const norm = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  switch (norm) {
    case "assigned":
      return {
        badgeText: "ASSIGNED",
        badgeBg: isDark ? "rgba(37, 99, 235, 0.2)" : "#EFF6FF",
        badgeColor: "#2563EB",
        description: "Responder assigned / Coordinating team",
      };
    case "in_progress":
      return {
        badgeText: "EN ROUTE",
        badgeBg: isDark ? "rgba(217, 119, 6, 0.2)" : "#FFFBEB",
        badgeColor: "#D97706",
        description: "Responder en route to location",
      };
    case "resolved":
      return {
        badgeText: "RESOLVED",
        badgeBg: isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5",
        badgeColor: "#059669",
        description: "Emergency response completed",
      };
    case "cancelled":
      return {
        badgeText: "CANCELLED",
        badgeBg: isDark ? "rgba(113, 113, 122, 0.2)" : "#F4F4F5",
        badgeColor: "#71717A",
        description: "Request cancelled",
      };
    default:
      return {
        badgeText: "ACTIVE",
        badgeBg: isDark ? "rgba(220, 38, 38, 0.2)" : "#FEF2F2",
        badgeColor: "#DC2626",
        description: "Report received / Responding",
      };
  }
}

export function OwnReportPreviewCard({
  marker,
  onViewDetails,
  onClose,
  bottomOffset = 80,
}: OwnReportPreviewCardProps) {
  const { isDark } = useTheme();
  const emergency = marker.emergency;
  const visual = getMobileEmergencyVisual(emergency.type);
  const EmergencyIcon = visual.icon;
  const statusDetails = getStatusDetails(emergency.status, isDark);

  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(24);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 120,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [emergency.id, slideAnim, opacityAnim]);

  const cardBg = isDark ? "#0E1626" : "#FFFFFF";
  const borderColor = isDark ? "#1E293B" : "#E2E8F0";
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const subTextColor = isDark ? "#94A3B8" : "#64748B";
  const statusSectionBg = isDark ? "#162032" : "#F8FAFC";

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          bottom: bottomOffset,
          backgroundColor: cardBg,
          borderColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: `${visual.markerColor}18` }]}>
            <EmergencyIcon size={18} color={visual.markerColor} strokeWidth={2.4} />
          </View>
          <Text style={[styles.titleText, { color: textColor }]} numberOfLines={1}>
            {emergency.title || mobileEmergencyTitle(emergency.type)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: statusDetails.badgeBg }]}>
            <Text style={[styles.badgeText, { color: statusDetails.badgeColor }]}>
              {statusDetails.badgeText}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close report preview"
          >
            <Ionicons name="close" size={18} color={subTextColor} />
          </Pressable>
        </View>
      </View>

      {/* Reference Number */}
      {emergency.referenceNumber ? (
        <Text style={[styles.refText, { color: subTextColor }]} numberOfLines={1}>
          {emergency.referenceNumber}
        </Text>
      ) : null}

      {/* Meta Info: Location & Timestamp */}
      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <Ionicons name="location-sharp" size={15} color="#DC2626" style={styles.metaIcon} />
          <Text style={[styles.metaText, { color: textColor }]} numberOfLines={1}>
            {emergency.location.label ||
              `${emergency.location.lat.toFixed(5)}, ${emergency.location.lng.toFixed(5)}`}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={subTextColor} style={styles.metaIcon} />
          <Text style={[styles.metaSubText, { color: subTextColor }]} numberOfLines={1}>
            {formatReportedTime(emergency.reportedAt)}
          </Text>
        </View>
      </View>

      {/* Status Description Box */}
      <View
        style={[
          styles.statusBox,
          {
            backgroundColor: statusSectionBg,
            borderColor,
          },
        ]}
      >
        <Text style={[styles.statusSubtitle, { color: subTextColor }]}>CURRENT STATUS</Text>
        <Text style={[styles.statusValue, { color: textColor }]} numberOfLines={1}>
          {statusDetails.description}
        </Text>
      </View>

      {/* CTA Button: View Request Details */}
      <Pressable
        onPress={() => onViewDetails(emergency.id)}
        style={styles.actionButton}
        accessibilityRole="button"
        accessibilityLabel="View request details"
      >
        <Text style={styles.actionButtonText}>View Request Details</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    zIndex: 25,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "800",
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  closeButton: {
    padding: 2,
  },
  refText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  metaContainer: {
    marginTop: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    width: 16,
    textAlign: "center",
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  metaSubText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  statusBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  statusSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#DC2626",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
