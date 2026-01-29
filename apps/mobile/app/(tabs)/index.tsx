import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const startHold = useCallback(() => {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      Alert.alert("SOS sent", "Your alert was sent to responders.");
    }, 3000);
  }, []);

  const cancelHold = useCallback(() => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: 140 + insets.bottom }, // IMPORTANT: keeps content above tabbar
        ]}
      >
        {/* Top bar */}
        <View style={styles.topRow}>
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color="#111827" />
            </View>
            <View>
              <Text style={styles.hello}>Hi, John Doe</Text>
              <Text style={styles.sub}>How are you today</Text>
            </View>
          </View>

          <Pressable style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.h1}>Emergency help{"\n"}needed?</Text>
          <Text style={styles.h2}>
            Press the button below and help{"\n"}reach you shortly.
          </Text>
        </View>

        {/* SOS */}
        <View style={styles.sosBlock}>
          <View style={styles.sosOuter}>
            <Pressable
              onPressIn={startHold}
              onPressOut={cancelHold}
              style={[styles.sosInner, holding && styles.sosInnerHolding]}
            >
              <View style={styles.warnCircle}>
                <Ionicons name="warning" size={18} color="#fff" />
              </View>

              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosHint}>Hold for 3s</Text>
            </Pressable>
          </View>

          <Text style={styles.locationNote}>
            Your location will be shared with emergency{"\n"}responders
          </Text>
        </View>

        {/* Alert card */}
        <View style={[styles.card, { marginTop: 18 }]}>
          <View style={styles.cardIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Alert</Text>
            <Text style={styles.cardSub}>
              Tropical Depression approaching. Expected{"\n"}rainfall: Heavy
            </Text>
          </View>
        </View>

        {/* Recent Emergencies */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Emergencies</Text>
          <Pressable>
            <View style={styles.viewAllRow}>
              <Text style={styles.viewAll}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color="#2563EB" />
            </View>
          </Pressable>
        </View>

        <View style={styles.listCard} />
        <View style={styles.listCard} />
        <View style={styles.listCard} />

        {/* Volunteer CTA */}
        <View style={styles.volunteer}>
          <View style={styles.volCircle1} />
          <View style={styles.volCircle2} />

          <View style={styles.volRow}>
            <View style={styles.volBadge}>
              <Ionicons name="shield-outline" size={18} color="#fff" />
            </View>
            <Text style={styles.volTitle}>Become a Volunteer</Text>
          </View>

          <Text style={styles.volSub}>
            Join our community responders and help{"\n"}save lives in your barangays
          </Text>

          <Pressable style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply Now</Text>
          </Pressable>

          <Pressable style={styles.chatFab}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { paddingHorizontal: 16, paddingTop: 10 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profile: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hello: { fontSize: 12, color: "#111827", fontWeight: "700" },
  sub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerBlock: { marginTop: 22, alignItems: "center" },
  h1: {
    fontSize: 30,
    fontWeight: "900",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 36,
  },
  h2: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },

  sosBlock: { marginTop: 22, alignItems: "center" },
  sosOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  sosInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  sosInnerHolding: { backgroundColor: "#DC2626", transform: [{ scale: 0.98 }] },
  warnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sosText: { fontSize: 26, fontWeight: "900", color: "#fff" },
  sosHint: { fontSize: 11, color: "rgba(255,255,255,0.92)", marginTop: 2 },
  locationNote: {
    marginTop: 10,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 15,
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
  cardIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#D1D5DB" },
  cardTitle: { fontSize: 13, fontWeight: "800", color: "#111827" },
  cardSub: { fontSize: 11, color: "#6B7280", marginTop: 2, lineHeight: 15 },

  sectionRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#6B7280" },
  viewAllRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAll: { fontSize: 11, color: "#2563EB", fontWeight: "700" },

  listCard: {
    height: 70,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },

  volunteer: {
    marginTop: 14,
    backgroundColor: "#B91C1C",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
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
  volRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  volBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  volTitle: { color: "#fff", fontSize: 14, fontWeight: "900" },
  volSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 8, lineHeight: 15 },

  applyBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  applyText: { color: "#B91C1C", fontWeight: "900", fontSize: 11 },

  chatFab: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
