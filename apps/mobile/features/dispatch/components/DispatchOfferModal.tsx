import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DispatchOffer } from "../models/dispatch.types";

type Props = {
  visible: boolean;
  offer: DispatchOffer;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  loading?: boolean;
};

function labelForType(type: string) {
  const t = String(type ?? "SOS").toUpperCase();
  if (t === "FIRE") return "Fire";
  if (t === "FLOOD") return "Flood";
  if (t === "EARTHQUAKE") return "Earthquake";
  if (t === "MEDICAL") return "Medical";
  if (t === "OTHER") return "Other";
  return "SOS";
}

export function DispatchOfferModal({ visible, offer, onAccept, onDecline, onClose, loading }: Props) {
  const em = offer.emergency;
  const typeLabel = labelForType(em.emergencyType);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="alert-circle" size={18} color="#B91C1C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Dispatch Request</Text>
              <Text style={styles.sub} numberOfLines={2}>
                You were assigned to respond.
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={18} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.row}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{typeLabel}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{String(em.status ?? "OPEN")}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value} numberOfLines={1}>
                {em.lat.toFixed(5)}, {em.lng.toFixed(5)}
              </Text>
            </View>
            {em.notes ? (
              <View style={[styles.row, { alignItems: "flex-start" }]}>
                <Text style={styles.label}>Notes</Text>
                <Text style={[styles.value, { flex: 1 }]} numberOfLines={3}>
                  {em.notes}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onDecline}
              disabled={!!loading}
              style={[styles.btn, styles.btnGhost, loading && styles.btnDisabled]}
            >
              <Text style={styles.btnGhostText}>Decline</Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              disabled={!!loading}
              style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
            >
              <Text style={styles.btnPrimaryText}>{loading ? "Please wait..." : "Accept"}</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Accepting will open the map and zoom to the emergency pin.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  title: { fontSize: 15, fontWeight: "800", color: "#111827" },
  sub: { marginTop: 1, fontSize: 12, color: "#6B7280" },
  body: { padding: 14, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  value: { fontSize: 12, color: "#111827", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, padding: 14, paddingTop: 6 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#B91C1C" },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  btnGhostText: { color: "#111827", fontWeight: "800" },
  btnDisabled: { opacity: 0.7 },
  hint: { paddingHorizontal: 14, paddingBottom: 14, fontSize: 11, color: "#6B7280" },
});
