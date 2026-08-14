import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function LiveTrackingHeader() {
  return <View style={styles.container}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="chevron-back" size={27} color="#111827" /></Pressable><View style={styles.titleWrap}><View style={styles.titleRow}><Ionicons name="radio" size={20} color="#DC2626" /><Text style={styles.liveText}>LIVE</Text><Text style={styles.title}>Tracking</Text></View><Text style={styles.subtitle}>Real-time emergency updates</Text></View><Pressable onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.alertButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Open alerts"><Ionicons name="notifications-outline" size={22} color="#DC2626" /><Text style={styles.alertText}>Alerts</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  container: { minHeight: 78, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconButton: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF", shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  titleWrap: { flex: 1, marginHorizontal: 12 }, titleRow: { flexDirection: "row", alignItems: "center", gap: 4 }, liveText: { fontSize: 17, fontWeight: "900", color: "#DC2626" }, title: { fontSize: 20, fontWeight: "900", color: "#0F172A" }, subtitle: { marginTop: 3, fontSize: 13, color: "#64748B", fontWeight: "600" },
  alertButton: { minWidth: 72, height: 48, paddingHorizontal: 12, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }, alertText: { fontSize: 14, fontWeight: "800", color: "#111827" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
