import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WeatherSeverity } from "../../weather/services/weatherApi";
import { useTheme } from "../../theme/useTheme";
import { resolveAvatarUri } from "../../profile/utils/avatarUrl";
import { RefreshableScrollScreen } from "../../common/components/RefreshableScrollScreen";

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
  refreshing?: boolean;
  activeRequest?: {
    id: string;
    trackingLabel: string;
    etaText: string;
    lastUpdatedText: string;
  };
  onStartHold: () => void;
  onCancelHold: () => void;
  onRefresh?: () => void;
  onPressAlert?: () => void;
  onPressTracking?: () => void;
  onPressNotifications?: () => void;
  onPressViewAll?: () => void;
  onPressApplyVolunteer?: () => void;
  showVolunteerCta?: boolean;
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
  refreshing,
  activeRequest,
  onStartHold,
  onCancelHold,
  onRefresh,
  onPressAlert,
  onPressTracking,
  onPressNotifications,
  onPressViewAll,
  onPressApplyVolunteer,
  showVolunteerCta = true,
}: Props) {
  const insets = useSafeAreaInsets();
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
            toValue: 1.14,
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
            toValue: 1.05,
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
    >
      <RefreshableScrollScreen
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 1 + insets.bottom },
        ]}
      >
        {/* Top bar */}
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
            <View>
              <Text style={[styles.hello, isDark ? styles.helloDark : null]}>Hi, {displayName}</Text>
              <Text style={[styles.sub, isDark ? styles.subDark : null]}>How are you today</Text>
            </View>
          </View>

          <Pressable style={[styles.bellBtn, isDark ? styles.bellBtnDark : null]} onPress={onPressNotifications}>
            <Ionicons name="notifications-outline" size={25} color={isDark ? "#E2E8F0" : "#111827"} />
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={[styles.h1, isDark ? styles.h1Dark : null]}>Emergency help{"\n"}needed?</Text>
          <Text style={[styles.h2, isDark ? styles.h2Dark : null]}>
            Press the button below and help{"\n"}reach you shortly.
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
                <Ionicons name="warning" size={18} color="#fff" />
              </View>

              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosHint}>
                {holding ? `Keep holding... ${remainingSeconds}s` : "Hold for 3s"}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.locationNote, isDark ? styles.locationNoteDark : null]}>
            Your location will be shared with emergency responders
          </Text>
        </View>

        {/* Alert card */}
        <Pressable
          onPress={onPressAlert}
          disabled={!onPressAlert}
          style={({ pressed }) => [
            styles.card,
            { marginTop: 60 },
            {
              backgroundColor: weatherCardBackground,
              borderColor: alertTheme.cardBorderColor,
            },
            pressed && onPressAlert ? styles.cardPressed : null,
          ]}
        >
          <View style={[styles.cardIcon, { backgroundColor: alertTheme.iconBackgroundColor }]}>
            <Ionicons
              name={alertIconName}
              size={24}
              color={alertTheme.iconColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardHeadline, { color: weatherTitleColor }]}>
              {alertTitle}
            </Text>
            <Text style={[styles.cardSub, { color: weatherTextColor }]}>{alertMessage}</Text>
            {alertRetryEnabled ? <Text style={[styles.cardRetry, { color: weatherRetryColor }]}>Tap to retry</Text> : null}
          </View>
        </Pressable>

        {activeRequest ? (
          <Pressable
            onPress={onPressTracking}
            disabled={!onPressTracking}
            style={({ pressed }) => [
              styles.activeRequestCard,
              pressed && onPressTracking ? styles.activeRequestCardPressed : null,
            ]}
          >
            <Text style={styles.activeRequestTitle}>Active Emergency Request</Text>

            <View style={styles.activeStatusPill}>
              <Text style={styles.activeStatusPillText}>{activeRequest.trackingLabel}</Text>
            </View>

            <Text style={styles.activeEta}>{activeRequest.etaText}</Text>

            <View style={styles.activeRequestButton}>
              <Text style={styles.activeRequestButtonText}>View Tracking Details</Text>
            </View>

            <Text style={styles.activeLiveText}>LIVE • updated {activeRequest.lastUpdatedText}</Text>
          </Pressable>
        ) : null}

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
              Join our community responders and help{"\n"}save lives in your barangays
            </Text>

            <Pressable style={styles.applyBtn} onPress={onPressApplyVolunteer}>
              <Text style={styles.applyText}>Apply Now</Text>
            </Pressable>
          </View>
        ) : null}
      </RefreshableScrollScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  safeLight: { backgroundColor: "#F6F7F9" },
  safeDark: { backgroundColor: "#060C18" },
  container: { paddingHorizontal: 16, paddingTop: 60 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profile: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
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
    marginRight: 6,
    borderColor: "#E5E7EB",
  },
  bellBtnDark: {
    backgroundColor: "#0E1626",
    borderColor: "#162544",
  },

  headerBlock: { marginTop: 60, alignItems: "center" },
  h1: {
    fontSize: 40,
    fontWeight: "900",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 38,
  },
  h1Dark: {
    color: "#E2E8F0",
  },
  h2: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 40,
    lineHeight: 16,
  },
  h2Dark: {
    color: "#94A3B8",
  },

  sosBlock: { marginTop: 22, alignItems: "center" },
  sosOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#EF4444",
  },
  sosInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sosText: { fontSize: 46, fontWeight: "600", color: "#fff" },
  sosHint: { fontSize: 13, color: "rgba(255,255,255,0.92)", marginTop: 2 },
  locationNote: {
    marginTop: 30,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
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
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardIcon: {
    width: 58,
    height: 58,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeadline: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  cardSub: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 15 },
  cardRetry: { fontSize: 11, marginTop: 4, fontWeight: "700" },

  activeRequestCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  activeRequestCardPressed: {
    opacity: 0.9,
  },
  activeRequestTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7F1D1D",
  },
  activeStatusPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DC2626",
  },
  activeStatusPillText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  activeEta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  activeRequestButton: {
    marginTop: 12,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
  },
  activeRequestButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#B91C1C",
  },
  activeLiveText: {
    marginTop: 8,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "700",
  },


  volunteer: {
    marginTop: 25,
    backgroundColor: "#B91C1C",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
    height: 230,
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
  volTitle: { color: "#fff", fontSize: 25, fontWeight: "900" },
  volSub: { color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 10, lineHeight: 15 },

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
