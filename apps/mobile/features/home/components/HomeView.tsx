import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { WeatherSeverity } from "../../weather/services/weatherApi";
import { useTheme } from "../../theme/useTheme";
import { resolveAvatarUri } from "../../profile/utils/avatarUrl";
import { RefreshableScrollScreen } from "../../common/components/RefreshableScrollScreen";
import { useBottomNavMetrics } from "../../common/hooks/useBottomNavMetrics";
import { Skeleton, SkeletonRegion } from "../../../components/ui/Skeleton";
import { ActiveRequestCardSkeleton } from "../../requests/components/RequestsSkeletons";
import {
  isActiveRequestTrackingLabel,
  type MyRequestSummary,
  type MyRequestTrackingDTO,
} from "../../requests/models/myRequests";
import { normalizeTrackingLabel } from "../../requests/tracking/utils/tracking.utils";
import { ActiveEmergencyRequestCard } from "./ActiveEmergencyRequestCard";
import { NoActiveEmergencyCard } from "./NoActiveEmergencyCard";
import { ScaledHomeContent } from "./ScaledHomeContent";

type AlertIconName = React.ComponentProps<typeof Ionicons>["name"];
type AlertTheme = {
  cardBackgroundColor: string;
  cardBorderColor: string;
  iconBackgroundColor: string;
  iconColor: string;
  headlineColor: string;
  retryColor: string;
};

function withOpacity(hexColor: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const normalized = hexColor.trim();
  const raw = normalized.startsWith("#") ? normalized.slice(1) : normalized;

  if (!/^[0-9A-Fa-f]{6}$/.test(raw)) return normalized;

  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${raw}${alphaHex}`;
}

function normalizeHexColor(value: string): string | null {
  const normalized = value.trim();
  const raw = normalized.startsWith("#") ? normalized.slice(1) : normalized;

  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  if (/^[0-9A-Fa-f]{3}$/.test(raw)) {
    const expanded = raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase();
    return `#${expanded}`;
  }

  return null;
}

function mixHexColors(base: string, target: string, ratio: number): string | null {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const baseHex = normalizeHexColor(base);
  const targetHex = normalizeHexColor(target);
  if (!baseHex || !targetHex) return null;

  const baseNum = parseInt(baseHex.slice(1), 16);
  const targetNum = parseInt(targetHex.slice(1), 16);

  const br = (baseNum >> 16) & 0xff;
  const bg = (baseNum >> 8) & 0xff;
  const bb = baseNum & 0xff;

  const tr = (targetNum >> 16) & 0xff;
  const tg = (targetNum >> 8) & 0xff;
  const tb = targetNum & 0xff;

  const r = Math.round(br + (tr - br) * safeRatio);
  const g = Math.round(bg + (tg - bg) * safeRatio);
  const b = Math.round(bb + (tb - bb) * safeRatio);

  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function tintHex(color: string, amount: number): string | null {
  return mixHexColors(color, "#FFFFFF", amount);
}

function shadeHex(color: string, amount: number): string | null {
  return mixHexColors(color, "#000000", amount);
}

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  avatarAuthToken?: string | null;
  onPressProfile?: () => void;
  holding: boolean;
  remainingSeconds: number;
  alertTitle: string;
  alertMessage: string;
  alertSeverity: WeatherSeverity;
  alertIconName: AlertIconName;
  alertTheme: AlertTheme;
  alertRetryEnabled?: boolean;
  alertLoading?: boolean;
  refreshing?: boolean;
  activeRequest?: MyRequestSummary;
  activeRequestLoading?: boolean;
  activeRequestTracking?: MyRequestTrackingDTO | null;
  onStartHold: () => void;
  onCancelHold: () => void;
  onRefresh?: () => void;
  onPressAlert?: () => void;
  onPressTracking?: () => void;
  onPressNotifications?: () => void;
  onPressApplyVolunteer?: () => void;
  showVolunteerCta?: boolean;
  onPressViewMyRequests?: () => void;
};

export function HomeView({
  displayName,
  avatarUrl,
  avatarAuthToken,
  onPressProfile,
  holding,
  remainingSeconds,
  alertTitle,
  alertMessage,
  alertSeverity,
  alertIconName,
  alertTheme,
  alertRetryEnabled,
  alertLoading = false,
  refreshing,
  activeRequest,
  activeRequestLoading = false,
  activeRequestTracking,
  onStartHold,
  onCancelHold,
  onRefresh,
  onPressAlert,
  onPressTracking,
  onPressNotifications,
  onPressApplyVolunteer,
  showVolunteerCta = true,
  onPressViewMyRequests,
}: Props) {
  const { screenContentBottomPadding } = useBottomNavMetrics();
  const { isDark } = useTheme();

  const weatherCardBackground = withOpacity(alertTheme.cardBackgroundColor, 0.1);
  const weatherBaseColor = alertTheme.headlineColor;
  const weatherTitleColor = isDark
    ? (tintHex(weatherBaseColor, 0.55) ?? alertTheme.headlineColor)
    : (shadeHex(weatherBaseColor, 0.2) ?? alertTheme.headlineColor);
  const weatherTextColor = isDark
    ? (tintHex(weatherBaseColor, 0.35) ?? alertTheme.headlineColor)
    : (shadeHex(weatherBaseColor, 0.08) ?? alertTheme.headlineColor);
  const weatherRetryColor = isDark
    ? (tintHex(alertTheme.retryColor, 0.55) ?? alertTheme.retryColor)
    : (shadeHex(alertTheme.retryColor, 0.16) ?? alertTheme.retryColor);
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const resolvedAvatarUri = useMemo(() => resolveAvatarUri(avatarUrl), [avatarUrl]);
  const safeDisplayName = String(displayName ?? "").trim() || "Guest";

  const hasActiveRequest = useMemo(() => {
    if (!activeRequest) return false;
    const currentTracking =
      activeRequestTracking?.request.id === activeRequest.id ? activeRequestTracking : null;
    const trackingLabel = normalizeTrackingLabel(
      currentTracking?.tracking.label ?? activeRequest.trackingStatus
    );
    return isActiveRequestTrackingLabel(trackingLabel);
  }, [activeRequest, activeRequestTracking]);

  useEffect(() => {
    if (!holding) {
      pulseScale.stopAnimation();
      pulseOpacity.stopAnimation();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.12,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.04,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      pulseScale.stopAnimation();
      pulseOpacity.stopAnimation();
    };
  }, [holding, pulseOpacity, pulseScale]);

  return (
    <SafeAreaView
      style={[styles.safe, isDark ? styles.safeDark : styles.safeLight]}
      className="bg-lgu-lightBg dark:bg-lgu-darkBg"
      edges={["top", "left", "right"]}
    >
      <RefreshableScrollScreen
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: screenContentBottomPadding,
          },
        ]}
      >
        {/* Top bar (native / unscaled) */}
        <View style={styles.topRow}>
          <View style={styles.profile}>
            <Pressable
              onPress={onPressProfile}
              disabled={!onPressProfile}
              hitSlop={8}
              style={({ pressed }) => [
                styles.avatar,
                {
                  borderColor: isDark ? "#2563EB" : "#EF4444",
                  backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
                },
                onPressProfile && pressed ? { opacity: 0.78 } : null,
              ]}
            >
              {resolvedAvatarUri ? (
                <Image
                  source={{
                    uri: resolvedAvatarUri,
                    ...(avatarAuthToken ? { headers: { Authorization: `Bearer ${avatarAuthToken}` } } : {}),
                  }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={16} color={isDark ? "#E2E8F0" : "#111827"} />
              )}
            </Pressable>
            <View style={styles.profileText}>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
                style={[styles.hello, isDark ? styles.helloDark : null]}
              >
                Hello, {safeDisplayName}!
              </Text>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
                style={[styles.sub, isDark ? styles.subDark : null]}
              >
                How are you doing today?
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.bellBtn, isDark ? styles.bellBtnDark : null]}
            onPress={onPressNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color={isDark ? "#E2E8F0" : "#111827"} />
          </Pressable>
        </View>

        {/* Scaled Home Composition */}
        <ScaledHomeContent>
          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text
              numberOfLines={2}
              maxFontSizeMultiplier={1.15}
              style={[styles.h1, isDark ? styles.h1Dark : null]}
            >
              Emergency help{"\n"}needed?
            </Text>
            <Text
              maxFontSizeMultiplier={1.25}
              style={[styles.h2, isDark ? styles.h2Dark : null]}
            >
              Press the button below and help reach you shortly.
            </Text>
          </View>

          {/* SOS */}
          <View style={styles.sosBlock}>
            <View
              style={[
                styles.sosOuter,
                isDark ? styles.sosOuterDark : null,
                holding && styles.sosOuterHolding,
                holding && isDark ? styles.sosOuterHoldingDark : null,
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.sosPulse,
                  {
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />

              <Pressable
                onPressIn={onStartHold}
                onPressOut={onCancelHold}
                style={[
                  styles.sosInner,
                  isDark ? styles.sosInnerShadow : null,
                  isDark ? styles.sosInnerDark : null,
                  holding && styles.sosInnerHolding,
                  holding && isDark ? styles.sosInnerHoldingDark : null,
                ]}
              >
                <View style={styles.warnCircle}>
                  <Ionicons name="warning" size={16} color="#fff" />
                </View>

                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosHint}>
                  {holding ? `Keep holding... ${remainingSeconds}s` : "Hold for 3s"}
                </Text>
              </Pressable>
            </View>

            <Text
              maxFontSizeMultiplier={1.25}
              style={[styles.locationNote, isDark ? styles.locationNoteDark : null]}
            >
              Your location will be shared with emergency responders
            </Text>
          </View>

          {/* Alert card */}
          <Pressable
            onPress={onPressAlert}
            disabled={!onPressAlert}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: weatherCardBackground,
                borderColor: alertTheme.cardBorderColor,
              },
              pressed && onPressAlert ? styles.cardPressed : null,
            ]}
          >
            {alertLoading ? (
              <SkeletonRegion label="Loading local weather alerts" style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Skeleton width={52} height={52} radius={12} />
                <View style={styles.cardContent}>
                  <Skeleton width="46%" height={16} />
                  <View style={{ marginTop: 9 }}><Skeleton width="90%" height={12} /></View>
                  <View style={{ marginTop: 7 }}><Skeleton width="68%" height={12} /></View>
                </View>
              </SkeletonRegion>
            ) : (
              <>
                <View style={[styles.cardIcon, { backgroundColor: alertTheme.iconBackgroundColor }]}>
                  <Ionicons name={alertIconName} size={24} color={alertTheme.iconColor} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardHeadline, { color: weatherTitleColor }]}>{alertTitle}</Text>
                  <Text style={[styles.cardSub, { color: weatherTextColor }]}>{alertMessage}</Text>
                  {alertRetryEnabled ? <Text style={[styles.cardRetry, { color: weatherRetryColor }]}>Tap to retry</Text> : null}
                </View>
              </>
            )}
          </Pressable>

          {/* Active Request / No Active Request */}
          {activeRequestLoading && !activeRequest ? (
            <ActiveRequestCardSkeleton />
          ) : hasActiveRequest && activeRequest ? (
            <ActiveEmergencyRequestCard
              request={activeRequest}
              tracking={activeRequestTracking}
              onPressTracking={onPressTracking}
            />
          ) : (
            <NoActiveEmergencyCard
              onPressViewMyRequests={onPressViewMyRequests}
            />
          )}

          {/* Volunteer CTA */}
          {showVolunteerCta ? (
            <View style={styles.volunteer}>
              <View style={styles.volCircle1} />
              <View style={styles.volCircle2} />

              <View style={styles.volRow}>
                <View style={styles.volBadge}>
                  <Ionicons name="shield-outline" size={30} color="#fff" />
                </View>
                <Text style={styles.volTitle}>Become a Volunteer</Text>
              </View>

              <Text style={styles.volSub}>
                Join our community responders and help save lives in your barangays
              </Text>

              <Pressable style={styles.applyBtn} onPress={onPressApplyVolunteer}>
                <Text style={styles.applyText}>Apply Now</Text>
              </Pressable>
            </View>
          ) : null}
        </ScaledHomeContent>
      </RefreshableScrollScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  safeLight: { backgroundColor: "#F6F7F9" },
  safeDark: { backgroundColor: "#060C18" },
  container: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingTop: 8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  profile: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  profileText: { flex: 1, minWidth: 0 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  hello: { fontSize: 18, color: "#111827", fontWeight: "700" },
  helloDark: { color: "#F1F5F9" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 1 },
  subDark: { color: "#94A3B8" },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexShrink: 0,
  },
  bellBtnDark: {
    backgroundColor: "#0E1626",
    borderColor: "#162544",
  },

  headerBlock: { alignItems: "center", paddingHorizontal: 8, marginTop: 18 },
  h1: {
    width: "100%",
    maxWidth: 430,
    fontWeight: "900",
    color: "#6B7280",
    textAlign: "center",
    fontSize: 28,
    lineHeight: 33,
  },
  h1Dark: {
    color: "#E2E8F0",
  },
  h2: {
    maxWidth: 320,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  h2Dark: {
    color: "#94A3B8",
  },

  sosBlock: { alignItems: "center", marginTop: 14 },
  sosOuter: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  sosOuterDark: {
    backgroundColor: "#111827",
    borderWidth: 1.5,
    borderColor: "#162544",
  },
  sosOuterHolding: { backgroundColor: "#FECACA" },
  sosOuterHoldingDark: {
    backgroundColor: "#1B2A45",
    borderColor: "#1E3A8A",
  },
  sosPulse: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "#EF4444",
  },
  sosInner: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  sosInnerShadow: {
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  sosInnerDark: {
    borderWidth: 3,
    borderColor: "#991B1B",
  },
  sosInnerHolding: {
    backgroundColor: "#DC2626",
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.24,
  },
  sosInnerHoldingDark: {
    borderColor: "#7F1D1D",
  },
  warnCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  sosText: {
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
    fontSize: 38,
    lineHeight: 40,
  },
  sosHint: { fontSize: 13, color: "rgba(255,255,255,0.92)", marginTop: 2, textAlign: "center" },
  locationNote: {
    maxWidth: 330,
    fontSize: 13.5,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 12,
  },
  locationNoteDark: {
    color: "#94A3B8",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 16,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardHeadline: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  cardSub: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 15 },
  cardRetry: { fontSize: 11, marginTop: 4, fontWeight: "700" },

  volunteer: {
    marginTop: 18,
    backgroundColor: "#B91C1C",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    minHeight: 230,
  },
  volCircle1: {
    position: "absolute",
    right: -40,
    top: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  volCircle2: {
    position: "absolute",
    right: 22,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  volRow: { flexDirection: "column", alignItems: "flex-start", gap: 1 },
  volBadge: {
    width: 50,
    height: 55,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  volTitle: { color: "#fff", fontSize: 25, fontWeight: "900", flexShrink: 1 },
  volSub: { color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 10, lineHeight: 20, maxWidth: 310 },

  applyBtn: {
    marginTop: 20,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyText: { color: "#B91C1C", fontWeight: "700", fontSize: 15 },
});
